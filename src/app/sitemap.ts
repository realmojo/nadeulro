import type { MetadataRoute } from "next";

import { placeDetailPath, regionPath } from "@/lib/places";
import { fetchPlaces } from "@/lib/places-server";
import { siteConfig } from "@/lib/site";

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
    "/stay",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
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

  // 장소 상세 페이지 + 지역 랜딩 페이지
  let placeEntries: MetadataRoute.Sitemap = [];
  const regionEntries: MetadataRoute.Sitemap = [];
  try {
    const { places } = await fetchPlaces();
    placeEntries = places.map((p) => ({
      url: `${siteConfig.url}${placeDetailPath(p.category, p.name)}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    // (카테고리 × 존재하는 지역) 조합만
    const seen = new Set<string>();
    for (const p of places) {
      if (!p.region) continue;
      const key = `${p.category}:${p.region}`;
      if (seen.has(key)) continue;
      seen.add(key);
      regionEntries.push({
        url: `${siteConfig.url}${regionPath(p.category, p.region)}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    /* DB 조회 실패 시 정적 경로만으로 사이트맵 생성 */
  }

  return [...staticEntries, ...regionEntries, ...placeEntries];
}
