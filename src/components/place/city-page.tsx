import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MapPinned, Route } from "lucide-react";

import {
  CATEGORIES,
  cityPath,
  placeDetailPath,
  regionPath,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import { fetchByCategoryRegion } from "@/lib/places-server";
import { nearPath } from "@/lib/near";
import { siteConfig } from "@/lib/site";

/**
 * 시군구 단위 카테고리 페이지 — "고양시 파크골프장" 같은 롱테일 검색을 받는다.
 * 데이터는 지역(시도) 조회 후 시군구로 걸러 재사용한다(별도 쿼리 불필요).
 */

/** 카테고리별 SEO 리드 문구 (시군구) */
const LEAD: Record<PlaceCategory, (r: string, c: string, n: number) => string> = {
  parkgolf: (r, c, n) =>
    `${r} ${c}의 파크골프장 ${n.toLocaleString()}곳을 정리했습니다. 각 구장의 홀수·운영기관·연락처를 확인하고 카카오맵 길찾기로 바로 출발할 수 있습니다.`,
  hotspring: (r, c, n) =>
    `${r} ${c}의 온천 ${n.toLocaleString()}곳입니다. 수온과 수질 성분, 위치와 연락처를 확인하고 가까운 온천에서 몸을 풀어보세요.`,
  swim: (r, c, n) =>
    `${r} ${c}의 수영장 ${n.toLocaleString()}곳입니다. 가까운 실내·야외 수영장의 위치를 확인하고 길찾기로 바로 이동할 수 있습니다.`,
  hiking: (r, c, n) =>
    `${r} ${c}의 등산 명소 ${n.toLocaleString()}곳입니다. 산의 높이와 소개를 확인하고 가볍게 오를 산부터 골라보세요.`,
  arboretum: (r, c, n) =>
    `${r} ${c}의 수목원·식물원·정원 ${n.toLocaleString()}곳입니다. 숲길과 꽃정원을 천천히 걷는 나들이를 계획해 보세요.`,
};

async function loadCity(
  category: PlaceCategory,
  regionRaw: string,
  cityRaw: string,
) {
  const region = decodeURIComponent(regionRaw);
  const city = decodeURIComponent(cityRaw);
  const all = await fetchByCategoryRegion(category, region);
  const places = all.filter((p) => p.city === city);
  // 같은 지역의 다른 시군구 (내부링크용)
  const otherCities = new Map<string, number>();
  for (const p of all) {
    if (!p.city || p.city === city) continue;
    otherCities.set(p.city, (otherCities.get(p.city) ?? 0) + 1);
  }
  return { region, city, places, otherCities };
}

export async function cityMetadata(
  category: PlaceCategory,
  regionRaw: string,
  cityRaw: string,
): Promise<Metadata> {
  const meta = CATEGORIES[category];
  let region = "";
  let city = "";
  let places: Place[] = [];
  try {
    ({ region, city, places } = await loadCity(category, regionRaw, cityRaw));
  } catch {
    /* 조회 실패 시 기본 메타 */
  }
  if (places.length === 0) {
    return { title: `${city} ${meta.label}`, robots: { index: false } };
  }
  const title = `${region} ${city} ${meta.label} ${places.length.toLocaleString()}곳`;
  const description = LEAD[category](region, city, places.length);
  const url = `${siteConfig.url}${cityPath(category, region, city)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} | ${siteConfig.name}`, description, url },
  };
}

export async function CityPage({
  category,
  regionRaw,
  cityRaw,
}: {
  category: PlaceCategory;
  regionRaw: string;
  cityRaw: string;
}) {
  const meta = CATEGORIES[category];
  const { region, city, places, otherCities } = await loadCity(
    category,
    regionRaw,
    cityRaw,
  );
  if (places.length === 0) notFound();

  const url = `${siteConfig.url}${cityPath(category, region, city)}`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${region} ${city} ${meta.label}`,
    numberOfItems: places.length,
    itemListElement: places.slice(0, 100).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${siteConfig.url}${placeDetailPath(p.category, p.slug)}`,
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: meta.label, item: `${siteConfig.url}${meta.path}` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${region} ${meta.label}`,
        item: `${siteConfig.url}${regionPath(category, region)}`,
      },
      { "@type": "ListItem", position: 4, name: `${city} ${meta.label}`, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-4 md:py-8">
        <div className="flex items-center gap-2">
          <Link
            href={regionPath(category, region)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted"
            aria-label={`${region} ${meta.label} 목록으로`}
          >
            <ArrowLeft className="size-6" />
          </Link>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
          <Link
            href={regionPath(category, region)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {region} 전체 보기
          </Link>
        </div>

        <h1 className="font-display mt-4 text-2xl font-bold md:text-3xl">
          {region} {city} {meta.label}{" "}
          <span style={{ color: meta.color }}>
            {places.length.toLocaleString()}곳
          </span>
        </h1>
        <p className="mt-3 break-keep text-lg leading-relaxed text-muted-foreground">
          {LEAD[category](region, city, places.length)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href={meta.path}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-persimmon px-5 font-bold text-persimmon-foreground shadow-sm"
          >
            <MapPinned className="size-5" />
            지도에서 보기
          </Link>
          <Link
            href={nearPath(region, city)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-primary/25 bg-card px-4 font-semibold text-primary transition-colors hover:bg-accent"
          >
            <Route className="size-5" />
            {city} 하루 코스 조합 보기
          </Link>
        </div>

        {/* 목록 */}
        <ul className="mt-8 grid gap-2 sm:grid-cols-2">
          {places.map((p) => (
            <li key={p.id}>
              <Link
                href={placeDetailPath(p.category, p.slug)}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {p.address ?? city}
                    {p.category === "parkgolf" && p.attributes.holes
                      ? ` · ${p.attributes.holes}홀`
                      : ""}
                    {p.category === "hotspring" &&
                    p.attributes.temp &&
                    p.attributes.temp !== "-"
                      ? ` · 수온 ${p.attributes.temp}`
                      : ""}
                    {p.category === "hiking" && p.attributes.height
                      ? ` · 해발 ${p.attributes.height.toLocaleString()}m`
                      : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* 같은 지역 다른 시군구 */}
        {otherCities.size > 0 ? (
          <section className="mt-10 border-t pt-6">
            <h2 className="font-display flex items-center gap-1.5 text-lg font-bold">
              <MapPin className="size-5 text-muted-foreground" />
              {region}의 다른 지역 {meta.label}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...otherCities.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([c, n]) => (
                  <Link
                    key={c}
                    href={cityPath(category, region, c)}
                    className="inline-flex h-10 items-center gap-1 rounded-full border border-border bg-card px-3.5 text-[15px] font-medium text-foreground/80 hover:bg-muted"
                  >
                    {c}
                    <span className="text-muted-foreground">{n}</span>
                  </Link>
                ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
