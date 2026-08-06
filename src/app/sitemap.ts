import type { MetadataRoute } from "next";

import { blogPostPath } from "@/lib/blog";
import { fetchAllPublished } from "@/lib/blog-server";
import { coursePath } from "@/lib/course";
import { fetchCourses } from "@/lib/course-server";
import { nearPath } from "@/lib/near";
import { isIndexablePlace, placeDetailPath, regionPath } from "@/lib/places";
import { fetchSitemapPlaces } from "@/lib/places-server";
import { siteConfig } from "@/lib/site";
import { TOOLS, TOOLS_INDEX } from "@/lib/tools";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "/",
    "/map",
    "/parkgolf",
    "/hotspring",
    "/swim",
    "/hiking",
    "/guide",
    "/course",
    "/mountains-100",
    "/parkgolf-large",
    "/arboretum",
    "/near",
    TOOLS_INDEX.path,
    ...TOOLS.map((t) => t.path),
    "/stay",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/blog",
    "/blog/parkgolf",
    "/blog/hotspring",
    "/blog/swim",
    "/blog/hiking",
  ];

  const lowPriority = ["/privacy", "/terms", "/contact"];

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteConfig.url}${route === "/" ? "" : route}`,
    changeFrequency: lowPriority.includes(route) ? "yearly" : "weekly",
    priority:
      route === "/"
        ? 1
        : ["/map", "/parkgolf", "/hotspring", "/swim", "/hiking"].includes(route)
          ? 0.9
          : lowPriority.includes(route)
            ? 0.3
            : 0.7,
  }));

  // 장소 상세 페이지 + 지역 랜딩 페이지 + 시군구 허브
  let placeEntries: MetadataRoute.Sitemap = [];
  const regionEntries: MetadataRoute.Sitemap = [];
  const cityEntries: MetadataRoute.Sitemap = [];
  try {
    // 색인 판정이 본문 길이를 보므로 description 을 포함한 목록을 쓴다
    const places = await fetchSitemapPlaces();
    // 정보가 불완전하거나 본문이 stub 인 페이지는 제외 — 색인 품질 관리
    placeEntries = places.filter(isIndexablePlace).map((p) => ({
      url: `${siteConfig.url}${placeDetailPath(p.category, p.slug)}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    // (카테고리 × 존재하는 지역) 조합만
    const seen = new Set<string>();
    // 시군구 허브는 카테고리가 2종 이상일 때만 (1종이면 지역 페이지와 중복)
    const cityCats = new Map<string, Set<string>>();
    for (const p of places) {
      if (!p.region) continue;
      const key = `${p.category}:${p.region}`;
      if (!seen.has(key)) {
        seen.add(key);
        regionEntries.push({
          url: `${siteConfig.url}${regionPath(p.category, p.region)}`,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      if (p.city) {
        const ck = `${p.region}|${p.city}`;
        if (!cityCats.has(ck)) cityCats.set(ck, new Set());
        cityCats.get(ck)!.add(p.category);
      }
    }

    for (const [ck, cats] of cityCats) {
      if (cats.size < 2) continue;
      const [region, city] = ck.split("|");
      cityEntries.push({
        url: `${siteConfig.url}${nearPath(region, city)}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    /* DB 조회 실패 시 정적 경로만으로 사이트맵 생성 */
  }

  // 블로그 글
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchAllPublished();
    blogEntries = posts.map((p) => ({
      url: `${siteConfig.url}${blogPostPath(p.category, p.slug)}`,
      lastModified: p.updatedAt ?? p.publishedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    /* 무시 */
  }

  // 코스 페이지 (나들로 차별화 콘텐츠)
  let courseEntries: MetadataRoute.Sitemap = [];
  try {
    const courses = await fetchCourses();
    courseEntries = courses.map((c) => ({
      url: `${siteConfig.url}${coursePath(c.slug)}`,
      lastModified: c.updatedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.8,
    }));
  } catch {
    /* 무시 */
  }

  return [
    ...staticEntries,
    ...courseEntries,
    ...cityEntries,
    ...regionEntries,
    ...blogEntries,
    ...placeEntries,
  ];
}
