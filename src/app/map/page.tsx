import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { MapScreen } from "@/components/map/map-screen";
import { CATEGORIES, isPlaceCategory } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "나들이 지도 — 전체 보기",
  description:
    "전국 파크골프장·온천·수영장·등산 명소를 지도 한 장에서. 가까운 곳을 찾고 전화·길찾기까지 바로.",
  alternates: { canonical: `${siteConfig.url}/map` },
};

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  /* 구 쿼리스트링 링크(/map?cat=...)는 전용 라우트로 301 통합 */
  const { cat } = await searchParams;
  if (isPlaceCategory(cat)) {
    permanentRedirect(CATEGORIES[cat].path);
  }

  return (
    <>
      <MapScreen initialCategory="all" />
      <section className="sr-only">
        <h1>나들이 지도 — 전국 파크골프장·온천·수영장·등산 명소</h1>
        <ul>
          {Object.values(CATEGORIES).map((c) => (
            <li key={c.key}>
              {c.label}: {c.blurb}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
