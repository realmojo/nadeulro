import Link from "next/link";
import { MapPin, Phone } from "lucide-react";

import {
  CATEGORIES,
  REGION_ORDER,
  placeDetailPath,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import { PageHeader } from "@/components/page-header";
import { siteConfig } from "@/lib/site";

/**
 * 테마(큐레이션) 목록 페이지 공용 본문 — parkgolf-large 와 동일한 레이아웃.
 * 조건으로 거른 장소 목록을 지역별로 묶어 보여준다.
 */
export function ThemeListPage({
  category,
  title,
  description,
  intro,
  list,
  badge,
  related,
}: {
  category: PlaceCategory;
  /** h1 (PageHeader title) */
  title: string;
  /** PageHeader description */
  description: string;
  /** 본문 도입 문단들 */
  intro: React.ReactNode;
  /** 조건을 통과한 장소 (정렬까지 끝난 상태) */
  list: Place[];
  /** 카드에 표시할 핵심 수치 (예: "42.1°C", "해발 348m") */
  badge: (p: Place) => string | null;
  /** 함께 볼 테마 링크 */
  related?: Array<{ href: string; label: string }>;
}) {
  const color = CATEGORIES[category].color;

  const byRegion = new Map<string, Place[]>();
  for (const p of list) {
    const r = p.region || "기타";
    (byRegion.get(r) ?? byRegion.set(r, []).get(r)!).push(p);
  }
  const orderedRegions = [
    ...REGION_ORDER.filter((r) => byRegion.has(r)),
    ...[...byRegion.keys()].filter((r) => !REGION_ORDER.includes(r)),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
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
      <PageHeader eyebrow="큐레이션" title={title} description={description} />

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <div className="max-w-2xl space-y-4 break-keep text-lg leading-relaxed text-muted-foreground">
          {intro}
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
                {arr.map((p) => {
                  const b = badge(p);
                  return (
                    <li key={p.id}>
                      <Link
                        href={placeDetailPath(p.category, p.slug)}
                        className="group flex h-full items-center gap-3.5 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/40"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-lg font-bold group-hover:text-primary">
                            {p.name}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                            {b ? (
                              <span
                                className="font-mono font-semibold"
                                style={{ color }}
                              >
                                {b}
                              </span>
                            ) : null}
                            {p.city ? (
                              <span>
                                {b ? "· " : ""}
                                {[p.region, p.city].filter(Boolean).join(" ")}
                              </span>
                            ) : null}
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
                  );
                })}
              </ul>
            </section>
          );
        })}

        {related?.length ? (
          <section className="mt-12 border-t pt-6">
            <h2 className="font-display text-lg font-bold">함께 보기</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {related.map((r) => (
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
        ) : null}
      </div>
    </>
  );
}

/** "36.5°C" → 36.5 (파싱 실패 시 null) */
export function parseTempC(temp: string | undefined): number | null {
  if (!temp || temp === "-") return null;
  const m = temp.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}
