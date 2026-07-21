import type { Metadata } from "next";
import Link from "next/link";
import { Award, Mountain, MapPin } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { fetchPlaces } from "@/lib/places-server";
import {
  placeDetailPath,
  REGION_ORDER,
  type Place,
} from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "100대 명산 — 산림청 선정 전국 명산",
  description:
    "산림청이 선정한 전국 100대 명산을 지역별로 정리했습니다. 각 산의 해발 높이와 선정 이유, 위치를 확인하고 가까운 명산부터 도전해 보세요.",
  alternates: { canonical: `${siteConfig.url}/mountains-100` },
};

export default async function Mountains100Page() {
  let mountains: Place[] = [];
  try {
    const { places } = await fetchPlaces();
    mountains = places.filter(
      (p) => p.category === "hiking" && p.attributes.top100_reason,
    );
  } catch {
    /* 조회 실패해도 페이지는 뜬다 */
  }

  // 지역별 그룹, 각 지역 내 해발 높은 순
  const byRegion = new Map<string, Place[]>();
  for (const p of mountains) {
    const r = p.region || "기타";
    (byRegion.get(r) ?? byRegion.set(r, []).get(r)!).push(p);
  }
  for (const list of byRegion.values()) {
    list.sort((a, b) => (b.attributes.height ?? 0) - (a.attributes.height ?? 0));
  }
  const orderedRegions = [
    ...REGION_ORDER.filter((r) => byRegion.has(r)),
    ...[...byRegion.keys()].filter((r) => !REGION_ORDER.includes(r)),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "산림청 선정 100대 명산",
    numberOfItems: mountains.length,
    itemListElement: mountains.slice(0, 100).map((p, i) => ({
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
        title="100대 명산"
        description="산림청이 경관·역사·생태를 기준으로 뽑은 전국의 이름난 산. 가까운 명산부터 하나씩 올라보세요."
      />

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <div className="max-w-2xl space-y-4 break-keep text-lg leading-relaxed text-muted-foreground">
          <p>
            전국{" "}
            <b className="font-bold text-foreground">
              {mountains.length.toLocaleString()}곳
            </b>
            의 100대 명산을 지역별로 정리했습니다. 각 산의{" "}
            <b className="font-semibold text-foreground">해발 높이와 선정 이유</b>를
            함께 담아, 어떤 산인지 미리 감을 잡고 고를 수 있습니다.
          </p>
          <p>
            높은 산부터 도전할 필요는 없습니다. 집에서 가깝고 오르기 편한
            명산부터 시작해, 다녀온 산을 하나씩 채워 가는 재미를 느껴 보세요.
          </p>
        </div>

        {orderedRegions.map((region) => {
          const list = byRegion.get(region)!;
          return (
            <section key={region} className="mt-10">
              <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
                <MapPin className="size-6 text-primary" />
                {region}
                <span className="text-lg font-medium text-muted-foreground">
                  {list.length}곳
                </span>
              </h2>
              <ul className="mt-4 grid gap-3">
                {list.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={placeDetailPath(p.category, p.slug)}
                      className="group flex gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/40"
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-persimmon/10 text-persimmon">
                        <Mountain className="size-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-lg font-bold group-hover:text-primary">
                            {p.name}
                          </span>
                          {p.attributes.height ? (
                            <span className="font-mono text-sm text-muted-foreground">
                              해발 {p.attributes.height.toLocaleString()}m
                            </span>
                          ) : null}
                          {p.city ? (
                            <span className="text-sm text-muted-foreground">
                              · {p.city}
                            </span>
                          ) : null}
                        </span>
                        {p.attributes.top100_reason ? (
                          <span className="mt-1 line-clamp-2 block break-keep text-base leading-relaxed text-muted-foreground">
                            {p.attributes.top100_reason}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <div className="mt-10 flex items-center gap-2 rounded-2xl border bg-secondary/40 p-5 text-base text-muted-foreground">
          <Award className="size-5 shrink-0 text-persimmon" />
          <p className="break-keep leading-relaxed">
            선정 기준·목록은 기관에 따라 차이가 있을 수 있습니다. 산행 전
            난이도와 날씨를 확인하고 안전 수칙을 지켜 주세요.
          </p>
        </div>
      </div>
    </>
  );
}
