import type { Metadata } from "next";
import Link from "next/link";

import { MapScreen } from "@/components/map/map-screen";
import {
  CATEGORIES,
  placeDetailPath,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import { fetchPlaces } from "@/lib/places-server";
import { siteConfig } from "@/lib/site";

/** 카테고리별 SEO 문구 */
const SEO: Record<
  PlaceCategory,
  { title: string; description: string; intro: string }
> = {
  parkgolf: {
    title: "전국 파크골프장 지도",
    description:
      "전국 파크골프장의 위치를 카카오맵에서 한눈에. 홀수·운영기관·연락처·예약 정보까지 확인하고 길찾기로 바로 출발하세요.",
    intro:
      "9홀 연습장부터 90홀 대형 구장까지, 전국의 파크골프장을 지도에서 찾아보세요. 홀수와 운영기관, 전화번호를 확인하고 카카오맵 길찾기로 바로 이동할 수 있습니다.",
  },
  hotspring: {
    title: "전국 온천 지도",
    description:
      "전국 온천의 위치·수온·성분을 카카오맵에서 한눈에. 몸이 풀리는 진짜 온천을 골라 전화 확인 후 바로 출발하세요.",
    intro:
      "수온과 성분(탄산·유황 등)까지 확인할 수 있는 전국 온천 지도입니다. 나들이 마무리로 몸을 풀기 좋은 가까운 온천을 찾아보세요.",
  },
  swim: {
    title: "전국 수영장 지도",
    description:
      "전국 실내·야외 수영장의 위치를 카카오맵에서 한눈에. 가까운 수영장을 찾아 길찾기로 바로 출발하세요.",
    intro:
      "동네 실내수영장부터 호텔 풀까지, 전국 수영장을 지도에서 찾아보세요. 위치 확인 후 카카오맵 길찾기로 바로 이동할 수 있습니다.",
  },
  hiking: {
    title: "전국 등산 명소 지도",
    description:
      "전국 산·봉우리 등산 명소의 위치를 카카오맵에서 한눈에. 동네 뒷산부터 이름난 명산까지 가볍게 올라보세요.",
    intro:
      "동네 뒷산부터 이름난 명산까지, 전국 등산 명소를 지도에서 찾아보세요. 위치를 확인하고 카카오맵 길찾기로 들머리까지 바로 이동할 수 있습니다.",
  },
};

/** 카테고리 페이지 메타데이터 (실제 장소 수 포함) */
export async function categoryMetadata(cat: PlaceCategory): Promise<Metadata> {
  const meta = CATEGORIES[cat];
  const seo = SEO[cat];
  let count = 0;
  try {
    count = (await fetchPlaces()).counts[cat] ?? 0;
  } catch {
    /* 카운트 실패 시 숫자 없이 진행 */
  }
  const title = count > 0 ? `${seo.title} — ${count.toLocaleString()}곳` : seo.title;
  return {
    title,
    description: seo.description,
    alternates: { canonical: `${siteConfig.url}${meta.path}` },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description: seo.description,
      url: `${siteConfig.url}${meta.path}`,
    },
  };
}

/** 카테고리 지도 페이지 본문 — 지도 + 크롤링 가능한 보조 콘텐츠 */
export async function CategoryMapPage({ category }: { category: PlaceCategory }) {
  const meta = CATEGORIES[category];
  const seo = SEO[category];

  let count = 0;
  let regions: Array<[string, number]> = [];
  let sample: Place[] = [];
  try {
    const { places, counts } = await fetchPlaces();
    count = counts[category] ?? 0;
    const byRegion = new Map<string, number>();
    for (const p of places) {
      if (p.category !== category || !p.region) continue;
      byRegion.set(p.region, (byRegion.get(p.region) ?? 0) + 1);
    }
    regions = [...byRegion.entries()].sort((a, b) => b[1] - a[1]);
    sample = places.filter((p) => p.category === category).slice(0, 20);
  } catch {
    /* SEO 보조 콘텐츠 없이도 지도는 뜬다 */
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${seo.title}${count ? ` — ${count.toLocaleString()}곳` : ""}`,
    description: seo.description,
    url: `${siteConfig.url}${meta.path}`,
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MapScreen initialCategory={category} />

      {/* 검색엔진·스크린리더용 보조 콘텐츠 (지도 뒤에 위치) */}
      <section className="sr-only">
        <h1>
          {seo.title}
          {count ? ` — 전국 ${count.toLocaleString()}곳` : ""}
        </h1>
        <p>{seo.intro}</p>
        {regions.length > 0 && (
          <>
            <h2>지역별 {meta.label} 수</h2>
            <ul>
              {regions.map(([r, n]) => (
                <li key={r}>
                  {r} {meta.label} {n.toLocaleString()}곳
                </li>
              ))}
            </ul>
          </>
        )}
        {sample.length > 0 && (
          <>
            <h2>대표 {meta.label}</h2>
            <ul>
              {sample.map((p) => (
                <li key={p.id}>
                  <Link href={placeDetailPath(p.category, p.name)}>
                    {p.name}
                  </Link>
                  {p.address ? ` — ${p.address}` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
