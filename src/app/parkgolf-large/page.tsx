import type { Metadata } from "next";
import Link from "next/link";
import { Flag, MapPin, Phone } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { fetchPlaces } from "@/lib/places-server";
import {
  CATEGORIES,
  placeDetailPath,
  REGION_ORDER,
  type Place,
} from "@/lib/places";
import { siteConfig } from "@/lib/site";

const PG = CATEGORIES.parkgolf.color;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "대형 파크골프장 — 36홀 이상 전국 구장",
  description:
    "홀수가 많은 전국 대형 파크골프장(36홀 이상)을 지역별로 정리했습니다. 규모가 큰 구장을 홀수·위치·연락처와 함께 확인하고 여유롭게 라운딩하세요.",
  alternates: { canonical: `${siteConfig.url}/parkgolf-large` },
};

function holesOf(p: Place): number {
  const h = Number(p.attributes.holes);
  return Number.isFinite(h) ? h : 0;
}

export default async function ParkgolfLargePage() {
  let list: Place[] = [];
  try {
    const { places } = await fetchPlaces();
    list = places.filter((p) => p.category === "parkgolf" && holesOf(p) >= 36);
  } catch {
    /* 조회 실패해도 페이지는 뜬다 */
  }

  const byRegion = new Map<string, Place[]>();
  for (const p of list) {
    const r = p.region || "기타";
    (byRegion.get(r) ?? byRegion.set(r, []).get(r)!).push(p);
  }
  for (const arr of byRegion.values()) {
    arr.sort((a, b) => holesOf(b) - holesOf(a));
  }
  const orderedRegions = [
    ...REGION_ORDER.filter((r) => byRegion.has(r)),
    ...[...byRegion.keys()].filter((r) => !REGION_ORDER.includes(r)),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "전국 대형 파크골프장 (36홀 이상)",
    numberOfItems: list.length,
    itemListElement: list.slice(0, 100).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${siteConfig.url}${placeDetailPath(p.category, p.slug)}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        eyebrow="큐레이션"
        title="대형 파크골프장"
        description="여유롭게 오래 즐기고 싶다면 규모 큰 구장으로. 36홀 이상 파크골프장을 지역별로 모았습니다."
      />

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <div className="max-w-2xl space-y-4 break-keep text-lg leading-relaxed text-muted-foreground">
          <p>
            전국{" "}
            <b className="font-bold text-foreground">
              {list.length.toLocaleString()}곳
            </b>
            의 대형 파크골프장(36홀 이상)입니다. 홀수가 많을수록 대기가 적고
            다양한 코스를 즐길 수 있어, 동호회 라운딩이나 하루 나들이로 좋습니다.
          </p>
          <p>
            각 구장의 <b className="font-semibold text-foreground">홀수·위치·연락처</b>를
            확인하고, 카카오맵 길찾기로 바로 출발하세요.
          </p>
        </div>

        {orderedRegions.map((region) => {
          const arr = byRegion.get(region)!;
          return (
            <section key={region} className="mt-10">
              <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
                <MapPin className="size-6 text-primary" />
                {region}
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
                        style={{ backgroundColor: `${PG}1a`, color: PG }}
                      >
                        <Flag className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-bold group-hover:text-primary">
                          {p.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                          <span className="font-mono font-semibold" style={{ color: PG }}>
                            {holesOf(p)}홀
                          </span>
                          {p.city ? <span>· {p.city}</span> : null}
                          {p.phone ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="size-3.5" />
                              {p.phone}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
