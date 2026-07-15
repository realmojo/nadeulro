import type { MetadataRoute } from "next";

import { placeDetailPath } from "@/lib/places";
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
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteConfig.url}${route === "/" ? "" : route}`,
    changeFrequency: "weekly",
    priority:
      route === "/"
        ? 1
        : ["/map", "/parkgolf", "/hotspring", "/swim", "/hiking"].includes(route)
          ? 0.9
          : 0.7,
  }));

  // 장소 상세 페이지(name 기반) 전체 포함
  let placeEntries: MetadataRoute.Sitemap = [];
  try {
    const { places } = await fetchPlaces();
    placeEntries = places.map((p) => ({
      url: `${siteConfig.url}${placeDetailPath(p.category, p.name)}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    /* DB 조회 실패 시 정적 경로만으로 사이트맵 생성 */
  }

  return [...staticEntries, ...placeEntries];
}
