import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MapPinned } from "lucide-react";

import {
  CATEGORIES,
  REGION_ORDER,
  placeDetailPath,
  regionPath,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import {
  fetchByCategoryRegion,
  regionsForCategory,
} from "@/lib/places-server";
import { siteConfig } from "@/lib/site";

/** 카테고리별 SEO 리드 문구 */
const LEAD: Record<PlaceCategory, (r: string, n: number) => string> = {
  parkgolf: (r, n) =>
    `${r} 지역의 파크골프장 ${n.toLocaleString()}곳을 지도와 함께 정리했습니다. 각 파크골프장의 위치·홀수·운영기관·연락처를 확인하고 카카오맵 길찾기로 바로 출발할 수 있습니다.`,
  hotspring: (r, n) =>
    `${r} 지역의 온천 ${n.toLocaleString()}곳입니다. 수온과 수질 성분, 위치와 연락처를 확인하고 나들이 마무리로 몸을 풀기 좋은 가까운 온천을 찾아보세요.`,
  swim: (r, n) =>
    `${r} 지역의 수영장 ${n.toLocaleString()}곳입니다. 가까운 실내·야외 수영장을 찾아 위치를 확인하고 길찾기로 바로 이동할 수 있습니다.`,
  hiking: (r, n) =>
    `${r} 지역의 등산 명소 ${n.toLocaleString()}곳입니다. 산의 높이와 소개, 위치를 확인하고 가볍게 오를 산부터 이름난 명산까지 골라보세요.`,
  arboretum: (r, n) =>
    `${r} 지역의 수목원·식물원·정원 ${n.toLocaleString()}곳입니다. 숲길과 꽃정원의 소개와 위치를 확인하고 카카오맵 길찾기로 바로 나들이를 떠나보세요.`,
};

export async function regionMetadata(
  category: PlaceCategory,
  regionRaw: string,
): Promise<Metadata> {
  const region = decodeURIComponent(regionRaw);
  const meta = CATEGORIES[category];
  let count = 0;
  try {
    count = (await fetchByCategoryRegion(category, region)).length;
  } catch {
    /* 무시 */
  }
  if (count === 0) return { title: `${region} ${meta.label}`, robots: { index: false } };
  const title = `${region} ${meta.label} ${count.toLocaleString()}곳`;
  const description = LEAD[category](region, count);
  const url = `${siteConfig.url}${regionPath(category, region)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} | ${siteConfig.name}`, description, url },
  };
}

export async function generateRegionParams(
  category: PlaceCategory,
): Promise<Array<{ region: string }>> {
  try {
    const regions = await regionsForCategory(category);
    return regions.filter((r) => r.count > 0).map((r) => ({ region: r.region }));
  } catch {
    return [];
  }
}

export async function RegionPage({
  category,
  regionRaw,
}: {
  category: PlaceCategory;
  regionRaw: string;
}) {
  const region = decodeURIComponent(regionRaw);
  const meta = CATEGORIES[category];

  const places = await fetchByCategoryRegion(category, region);
  if (places.length === 0) notFound();

  const url = `${siteConfig.url}${regionPath(category, region)}`;

  // 도시(시군구)별 그룹
  const byCity = new Map<string, Place[]>();
  for (const p of places) {
    const c = p.city || "기타";
    (byCity.get(c) ?? byCity.set(c, []).get(c)!).push(p);
  }

  // 다른 지역(같은 카테고리) 링크 — 이 페이지에 존재하는 지역만 유효하나,
  // REGION_ORDER 전체를 노출하되 클릭 시 없는 지역은 404(색인 제외)로 처리됨.
  const otherRegions = REGION_ORDER.filter((r) => r !== region);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${region} ${meta.label}`,
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
      { "@type": "ListItem", position: 3, name: `${region} ${meta.label}`, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="mx-auto w-full max-w-3xl px-4 py-4 md:py-8">
        <div className="flex items-center gap-2">
          <Link
            href={meta.path}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted"
            aria-label={`${meta.label} 지도로`}
          >
            <ArrowLeft className="size-6" />
          </Link>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        <h1 className="font-display mt-4 text-2xl font-bold md:text-3xl">
          {region} {meta.label}{" "}
          <span style={{ color: meta.color }}>{places.length.toLocaleString()}곳</span>
        </h1>
        <p className="mt-3 break-keep text-lg leading-relaxed text-muted-foreground">
          {LEAD[category](region, places.length)}
        </p>

        <Link
          href={`${meta.path}`}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-persimmon px-5 font-bold text-persimmon-foreground shadow-sm"
        >
          <MapPinned className="size-5" />
          지도에서 {region} {meta.label} 보기
        </Link>

        {/* 도시별 목록 */}
        <div className="mt-8 space-y-8">
          {[...byCity.entries()].map(([city, list]) => (
            <section key={city}>
              <h2 className="font-display flex items-center gap-1.5 text-xl font-bold">
                <MapPin className="size-5 text-muted-foreground" />
                {city}
                <span className="text-base font-medium text-muted-foreground">
                  {list.length}곳
                </span>
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {list.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={placeDetailPath(p.category, p.slug)}
                      className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{p.name}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {p.city}
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
            </section>
          ))}
        </div>

        {/* 다른 지역 */}
        <section className="mt-10 border-t pt-6">
          <h2 className="font-display text-lg font-bold">다른 지역 {meta.label}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherRegions.map((r) => (
              <Link
                key={r}
                href={regionPath(category, r)}
                className="inline-flex h-10 items-center rounded-full border border-border bg-card px-3.5 text-[15px] font-medium text-foreground/80 hover:bg-muted"
              >
                {r}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
