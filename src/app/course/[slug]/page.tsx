import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Car,
  MapPin,
  Navigation,
  Phone,
  Route,
} from "lucide-react";

import {
  fetchCourseBySlug,
  fetchCourses,
  fetchCoursesByRegion,
} from "@/lib/course-server";
import { carMinutes, coursePath, type Course, type CourseStop } from "@/lib/course";
import { CATEGORIES, placeDetailPath } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

function kakaoTo(s: CourseStop): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}`;
}

export async function generateStaticParams() {
  try {
    const courses = await fetchCourses();
    return courses.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await fetchCourseBySlug(decodeURIComponent(slug)).catch(
    () => null,
  );
  if (!course) return { title: "코스를 찾을 수 없습니다", robots: { index: false } };
  const url = `${siteConfig.url}${coursePath(course.slug)}`;
  const description =
    course.summary ?? `${course.title} — 나들로가 추천하는 하루 나들이 코스.`;
  return {
    title: course.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${course.title} | ${siteConfig.name}`,
      description,
      url,
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await fetchCourseBySlug(decodeURIComponent(slug));
  if (!course) notFound();

  let related: Course[] = [];
  if (course.region) {
    related = await fetchCoursesByRegion(course.region, course.slug).catch(
      () => [],
    );
  }

  const url = `${siteConfig.url}${coursePath(course.slug)}`;
  const totalMin = carMinutes(course.totalKm);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: course.title,
    description: course.summary ?? undefined,
    url,
    inLanguage: "ko-KR",
    itinerary: {
      "@type": "ItemList",
      numberOfItems: course.stops.length,
      itemListElement: course.stops.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "TouristAttraction",
          name: s.name,
          ...(s.address ? { address: s.address } : {}),
          geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng },
          url: `${siteConfig.url}${placeDetailPath(s.category, s.slug)}`,
        },
      })),
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "나들이 코스", item: `${siteConfig.url}/course` },
      { "@type": "ListItem", position: 3, name: course.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <article className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="위치">
          <Link href="/course" className="hover:text-foreground">나들이 코스</Link>
          <span>›</span>
          {course.region ? <span>{course.region}</span> : null}
        </nav>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
            <Route className="size-4" />
            하루 코스
          </span>
          {course.city ? (
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium text-foreground/80">
              <MapPin className="size-3.5" />
              {[course.region, course.city].filter(Boolean).join(" ")}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium text-foreground/80">
            <Car className="size-3.5" />
            이동 약 {totalMin}분
          </span>
        </div>

        <h1 className="font-display mt-4 text-2xl font-bold leading-snug md:text-3xl">
          {course.title}
        </h1>
        {course.summary ? (
          <p className="mt-3 break-keep text-lg leading-relaxed text-foreground/85">
            {course.summary}
          </p>
        ) : null}

        {/* 타임라인 동선 */}
        <ol className="mt-8 space-y-0">
          {course.stops.map((s, i) => {
            const m = CATEGORIES[s.category];
            const last = i === course.stops.length - 1;
            return (
              <li key={s.id}>
                <div className="flex gap-4">
                  {/* 좌측 순서·라인 */}
                  <div className="flex flex-col items-center">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-sm"
                      style={{ backgroundColor: m.color }}
                    >
                      {i + 1}
                    </span>
                    {!last ? <span className="my-1 w-0.5 flex-1 bg-border" /> : null}
                  </div>

                  {/* 우측 카드 */}
                  <div className={`flex-1 ${last ? "" : "pb-6"}`}>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      {s.role}
                    </span>
                    <h2 className="mt-1.5 text-xl font-bold">
                      <Link
                        href={placeDetailPath(s.category, s.slug)}
                        className="hover:text-primary hover:underline"
                      >
                        {s.name}
                      </Link>
                    </h2>
                    {s.address ? (
                      <p className="mt-1 break-keep text-base text-muted-foreground">
                        {s.address}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={kakaoTo(s)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-persimmon px-4 text-base font-bold text-persimmon-foreground shadow-sm"
                      >
                        <Navigation className="size-4" />
                        길찾기
                      </a>
                      {s.phone ? (
                        <a
                          href={`tel:${s.phone.replace(/[^0-9+]/g, "")}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-primary/25 bg-card px-4 text-base font-semibold text-primary hover:bg-accent"
                        >
                          <Phone className="size-4" />
                          전화
                        </a>
                      ) : null}
                      <Link
                        href={placeDetailPath(s.category, s.slug)}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-border bg-card px-4 text-base font-semibold text-foreground/80 hover:bg-muted"
                      >
                        상세보기
                      </Link>
                    </div>

                    {/* 다음 장소까지 이동 */}
                    {!last && s.distanceToNextKm != null ? (
                      <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 text-sm font-medium text-muted-foreground">
                        <Car className="size-4" />
                        차로 약 {carMinutes(s.distanceToNextKm)}분 · 직선{" "}
                        {s.distanceToNextKm}km
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* 안내 */}
        <div className="mt-8 rounded-2xl border bg-secondary/40 p-5">
          <p className="break-keep text-base leading-relaxed text-foreground/85">
            이 코스는 두 장소의 위치를 이어 만든 <b className="font-semibold text-foreground">추천 동선</b>입니다.
            이동 시간은 직선거리 기준 대략값이며, 실제 소요 시간·운영 시간·요금은
            방문 전 각 시설에 확인해 주세요.
          </p>
        </div>

        <Link
          href="/course"
          className="mt-8 inline-flex items-center gap-1.5 text-base font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          다른 코스 더 보기
        </Link>
      </article>

      {related.length ? (
        <section className="mx-auto w-full max-w-2xl px-4 pb-12">
          <h2 className="font-display text-xl font-bold md:text-2xl">
            {course.region} 다른 코스
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((c) => (
              <li key={c.id}>
                <Link
                  href={coursePath(c.slug)}
                  className="flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
                >
                  <span className="break-keep text-base font-bold leading-snug">
                    {c.title}
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {c.city} · 이동 약 {carMinutes(c.totalKm)}분
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
