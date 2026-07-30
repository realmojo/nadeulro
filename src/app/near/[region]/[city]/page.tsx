import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Navigation, Route } from "lucide-react";

import { coursePath, type Course } from "@/lib/course";
import { fetchCourses } from "@/lib/course-server";
import {
  bestPairs,
  cityLead,
  nearPath,
  pairSentence,
  summarize,
} from "@/lib/near";
import { CATEGORIES, placeDetailPath, regionPath, type Place } from "@/lib/places";
import { fetchCityPlaces } from "@/lib/places-server";
import { siteConfig } from "@/lib/site";

export const revalidate = 86400;
export const dynamicParams = true;

type Props = { params: Promise<{ region: string; city: string }> };

async function load(props: Props) {
  const { region: r, city: c } = await props.params;
  const region = decodeURIComponent(r);
  const city = decodeURIComponent(c);
  const places = await fetchCityPlaces(region, city);
  return { region, city, places };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  let region = "";
  let city = "";
  let places: Place[] = [];
  try {
    ({ region, city, places } = await load(props));
  } catch {
    /* 조회 실패 시 기본 메타 */
  }
  if (!places.length) {
    return { title: `${region} ${city} 나들이`, robots: { index: false } };
  }

  const summary = summarize(region, city, places);
  const pairs = bestPairs(places);
  const title = `${region} ${city} 나들이 스팟 ${summary.total}곳`;
  const description = cityLead(summary, pairs).slice(0, 155);
  const url = `${siteConfig.url}${nearPath(region, city)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    // 카테고리가 하나뿐이면 기존 지역 페이지와 겹치므로 색인하지 않는다
    ...(summary.categoryCount >= 2
      ? {}
      : { robots: { index: false, follow: true } }),
    openGraph: { title: `${title} | ${siteConfig.name}`, description, url },
  };
}

export default async function Page(props: Props) {
  const { region, city, places } = await load(props);
  if (!places.length) notFound();

  const summary = summarize(region, city, places);
  const pairs = bestPairs(places);

  // 코스는 전체 139개뿐이라 한 번 읽고 이 동네 것만 걸러낸다
  let courses: Course[] = [];
  try {
    courses = (await fetchCourses()).filter(
      (c) => c.region === region && c.city === city,
    );
  } catch {
    /* 코스 없어도 본문은 렌더 */
  }

  const url = `${siteConfig.url}${nearPath(region, city)}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "동네별 나들이", item: `${siteConfig.url}/near` },
      { "@type": "ListItem", position: 3, name: `${region} ${city}`, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <article className="mx-auto w-full max-w-2xl px-4 py-4 md:py-8">
        <div className="flex items-center gap-2">
          <Link
            href="/near"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted"
            aria-label="동네별 나들이 목록으로"
          >
            <ArrowLeft className="size-6" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
            <MapPin className="size-4" />
            {region}
          </span>
        </div>

        <h1 className="font-display mt-4 text-2xl font-bold leading-snug md:text-3xl">
          {region} {city} 나들이 스팟 {summary.total}곳
        </h1>
        <p className="mt-3 break-keep text-lg leading-relaxed text-foreground/85">
          {cityLead(summary, pairs)}
        </p>

        {/* 구성 */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold md:text-2xl">
            무엇이 있나요
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {summary.counts.map((c) => (
              <li key={c.category}>
                <Link
                  href={regionPath(c.category, region)}
                  className="block rounded-xl border border-border/70 bg-card px-3 py-2.5 transition-colors hover:bg-accent/40"
                >
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CATEGORIES[c.category].color }}
                    />
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-xl font-bold tabular-nums">
                    {c.count}
                    <span className="ml-0.5 text-base font-semibold text-foreground/70">
                      곳
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 하루에 묶을 수 있는 조합 — 좌표에서 계산 */}
        {pairs.length ? (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold md:text-2xl">
              하루에 묶을 수 있는 조합
            </h2>
            <p className="mt-2 break-keep text-base leading-relaxed text-muted-foreground">
              {city} 안에서 서로 다른 종류끼리 가장 가까운 짝을 거리순으로
              계산했습니다. 이동 시간은 직선거리 기준 어림값입니다.
            </p>
            <ul className="mt-3 space-y-2">
              {pairs.map((p) => (
                <li
                  key={`${p.a.id}-${p.b.id}`}
                  className="rounded-xl border border-primary/25 bg-primary/5 p-4"
                >
                  <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
                    <Route className="size-4" />
                    차로 약 {p.minutes}분
                  </p>
                  <p className="mt-1.5 break-keep text-base font-medium leading-relaxed text-foreground/90">
                    {pairSentence(p)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-primary">
                    <Link
                      href={placeDetailPath(p.a.category, p.a.slug)}
                      className="hover:underline"
                    >
                      {p.a.name} 보기
                    </Link>
                    <Link
                      href={placeDetailPath(p.b.category, p.b.slug)}
                      className="hover:underline"
                    >
                      {p.b.name} 보기
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* 이 동네에 걸린 코스 */}
        {courses.length ? (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold md:text-2xl">
              {city}에서 시작하는 코스
            </h2>
            <ul className="mt-3 grid gap-2">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link
                    href={coursePath(c.slug)}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40"
                  >
                    <Navigation className="size-5 shrink-0 text-primary/70" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {c.title}
                      </span>
                      {c.totalKm != null ? (
                        <span className="block text-sm text-muted-foreground">
                          총 {c.totalKm.toFixed(1)}km
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* 전체 목록 */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold md:text-2xl">
            {city} 전체 목록
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {places.map((p) => {
              const m = CATEGORIES[p.category];
              return (
                <li key={p.id}>
                  <Link
                    href={placeDetailPath(p.category, p.slug)}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {p.name}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {m.label}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="mt-8 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
          거리와 소요 시간은 좌표 기준 직선거리로 계산한 어림값이며, 실제 도로
          사정에 따라 달라집니다. 운영시간·휴무일은 방문 전 각 시설에 확인하세요.
        </p>
      </article>
    </>
  );
}
