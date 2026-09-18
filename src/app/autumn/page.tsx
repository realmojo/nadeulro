import type { Metadata } from "next";
import Link from "next/link";
import { Award, Leaf, MapPin, Sunset, ThermometerSun } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  CATEGORIES,
  REGION_ORDER,
  isTop100,
  placeDetailPath,
  regionPath,
  type Place,
} from "@/lib/places";
import { fetchPlaces } from "@/lib/places-server";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "가을 단풍 나들이 특집 — 명산 산행과 온천 마무리",
  description:
    "단풍철에 오르기 좋은 산림청 100대 명산을 지역별로 모으고, 하산 후 몸을 풀 온천과 가을 수목원 산책까지 하루 코스로 이어드립니다.",
  alternates: { canonical: `${siteConfig.url}/autumn` },
};

export default async function AutumnPage() {
  let mountains: Place[] = [];
  let arboRegions: Array<[string, number]> = [];
  let hotRegions: Array<[string, number]> = [];
  try {
    const { places } = await fetchPlaces();
    mountains = places.filter((p) => p.category === "hiking" && isTop100(p));

    const count = (cat: Place["category"]) => {
      const m = new Map<string, number>();
      for (const p of places) {
        if (p.category !== cat || !p.region) continue;
        m.set(p.region, (m.get(p.region) ?? 0) + 1);
      }
      return [...m.entries()].sort(
        (a, b) => REGION_ORDER.indexOf(a[0]) - REGION_ORDER.indexOf(b[0]),
      );
    };
    arboRegions = count("arboretum");
    hotRegions = count("hotspring");
  } catch {
    /* 조회 실패해도 페이지는 뜬다 */
  }

  const byRegion = new Map<string, Place[]>();
  for (const p of mountains) {
    const r = p.region || "기타";
    (byRegion.get(r) ?? byRegion.set(r, []).get(r)!).push(p);
  }
  for (const arr of byRegion.values()) {
    arr.sort((a, b) => (b.attributes.height ?? 0) - (a.attributes.height ?? 0));
  }
  const orderedRegions = [
    ...REGION_ORDER.filter((r) => byRegion.has(r)),
    ...[...byRegion.keys()].filter((r) => !REGION_ORDER.includes(r)),
  ];

  const HIKE = CATEGORIES.hiking.color;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "가을 단풍 나들이 특집",
    description: metadata.description,
    url: `${siteConfig.url}/autumn`,
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        eyebrow="가을 특집"
        title="단풍 산행, 온천으로 마무리"
        description="단풍철 명산에 오르고, 내려와서는 뜨끈한 온천. 나들로가 가을 하루를 코스로 이어드립니다."
      />

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <div className="max-w-2xl space-y-4 break-keep text-lg leading-relaxed text-muted-foreground">
          <p>
            단풍은 보통 <b className="font-bold text-foreground">10월 중순 강원·경기 북부</b>
            에서 시작해 <b className="font-bold text-foreground">11월 초 남부</b>까지
            내려옵니다. 산림청이 선정한{" "}
            <b className="font-bold text-foreground">
              100대 명산 {mountains.length.toLocaleString()}곳
            </b>
            을 지역별로 모았으니, 단풍 시기에 맞춰 가까운 명산부터 올라보세요.
          </p>
          <p className="flex items-start gap-2">
            <Sunset className="mt-1 size-5 shrink-0 text-persimmon" />
            <span>
              가을은 해가 빨리 집니다. 10월엔 오후 5시 반 전후로 해가 지니, 각 산
              상세페이지의{" "}
              <b className="font-semibold text-foreground">월별 일몰·하산 시각</b>
              을 확인하고 여유 있게 내려오세요.
            </span>
          </p>
        </div>

        {/* 100대 명산 지역별 */}
        {orderedRegions.map((region) => {
          const arr = byRegion.get(region)!;
          return (
            <section key={region} className="mt-10">
              <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
                <MapPin className="size-6 text-primary" />
                {region} 단풍 명산
                <span className="text-lg font-medium text-muted-foreground">
                  {arr.length}곳
                </span>
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {arr.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={placeDetailPath(p.category, p.slug)}
                      className="group flex h-full items-center gap-3.5 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/40"
                    >
                      <span
                        className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${HIKE}1a`, color: HIKE }}
                      >
                        <Award className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-bold group-hover:text-primary">
                          {p.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                          {p.attributes.height ? (
                            <span className="font-mono font-semibold" style={{ color: HIKE }}>
                              해발 {p.attributes.height.toLocaleString()}m
                            </span>
                          ) : null}
                          {p.city ? <span>· {p.city}</span> : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* 수목원 단풍 산책 */}
        {arboRegions.length > 0 ? (
          <section className="mt-12 rounded-2xl border bg-secondary/40 p-6">
            <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
              <Leaf className="size-6" style={{ color: CATEGORIES.arboretum.color }} />
              산이 부담스럽다면, 수목원 단풍 산책
            </h2>
            <p className="mt-3 max-w-2xl break-keep text-lg leading-relaxed text-muted-foreground">
              평지 숲길을 천천히 걷는 수목원·식물원도 가을이 절정입니다. 지역을
              골라 가까운 수목원을 찾아보세요.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {arboRegions.map(([r, n]) => (
                <Link
                  key={r}
                  href={regionPath("arboretum", r)}
                  className="inline-flex h-10 items-center gap-1 rounded-full border border-border bg-card px-3.5 text-[15px] font-medium text-foreground/80 hover:bg-muted"
                >
                  {r} 수목원
                  <span className="text-muted-foreground">{n}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* 하산 후 온천 */}
        {hotRegions.length > 0 ? (
          <section className="mt-8 rounded-2xl border bg-secondary/40 p-6">
            <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
              <ThermometerSun className="size-6" style={{ color: CATEGORIES.hotspring.color }} />
              하산 후엔 온천으로 마무리
            </h2>
            <p className="mt-3 max-w-2xl break-keep text-lg leading-relaxed text-muted-foreground">
              가을 산행의 마무리는 뜨끈한 물입니다. 산행한 지역의 온천을 찾거나,
              수온 40°C 이상 원탕만 모은 목록에서 골라보세요.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/hotspring-hot"
                className="inline-flex h-10 items-center rounded-full bg-persimmon px-4 text-[15px] font-bold text-persimmon-foreground shadow-sm"
              >
                뜨거운 원탕 온천 보기
              </Link>
              {hotRegions.map(([r, n]) => (
                <Link
                  key={r}
                  href={regionPath("hotspring", r)}
                  className="inline-flex h-10 items-center gap-1 rounded-full border border-border bg-card px-3.5 text-[15px] font-medium text-foreground/80 hover:bg-muted"
                >
                  {r} 온천
                  <span className="text-muted-foreground">{n}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* 함께 보기 */}
        <section className="mt-12 border-t pt-6">
          <h2 className="font-display text-lg font-bold">함께 보기</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { href: "/mountains-100", label: "산림청 100대 명산 전체" },
              { href: "/hiking-easy", label: "처음 오르기 좋은 낮은 산" },
              { href: "/course", label: "하루 나들이 코스" },
              { href: "/tools/hiking-time", label: "산행 시간 계산기" },
            ].map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="inline-flex h-10 items-center rounded-full border border-border bg-card px-3.5 text-[15px] font-medium text-foreground/80 hover:bg-muted"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
