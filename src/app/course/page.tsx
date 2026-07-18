import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Route } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  fetchCourses,
} from "@/lib/course-server";
import { carMinutes, coursePath, type Course } from "@/lib/course";
import { CATEGORIES, REGION_ORDER } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "나들이 코스",
  description:
    "파크골프장과 가까운 온천을 하루 동선으로 묶은 나들로만의 나들이 코스. 오전엔 파크골프, 오후엔 온천 — 지역별 하루 코스를 찾아보세요.",
  alternates: { canonical: `${siteConfig.url}/course` },
};

export default async function CoursePage() {
  let courses: Course[] = [];
  try {
    courses = await fetchCourses();
  } catch {
    /* 조회 실패해도 페이지는 뜬다 */
  }

  const byRegion = new Map<string, Course[]>();
  for (const c of courses) {
    const r = c.region || "기타";
    (byRegion.get(r) ?? byRegion.set(r, []).get(r)!).push(c);
  }
  const orderedRegions = [
    ...REGION_ORDER.filter((r) => byRegion.has(r)),
    ...[...byRegion.keys()].filter((r) => !REGION_ORDER.includes(r)),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "나들로 나들이 코스",
    numberOfItems: courses.length,
    itemListElement: courses.slice(0, 100).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.title,
      url: `${siteConfig.url}${coursePath(c.slug)}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        eyebrow="나들로의 차별점"
        title="하루가 하나의 코스로"
        description="개별 장소를 나열하지 않습니다. 오전엔 파크골프, 오후엔 가까운 온천 — 하루 동선으로 잇습니다."
      />

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <p className="max-w-2xl break-keep text-lg leading-relaxed text-muted-foreground">
          전국{" "}
          <b className="font-bold text-foreground">
            {courses.length.toLocaleString()}개
          </b>
          의 하루 코스입니다. 각 코스는 파크골프장과 <b className="font-semibold text-foreground">차로 가까운 온천</b>을
          묶어, 몸을 움직이고 따뜻하게 풀어주는 흐름으로 짰습니다.
        </p>

        {orderedRegions.map((region) => {
          const list = byRegion.get(region)!;
          return (
            <section key={region} className="mt-12">
              <h2 className="font-display flex items-center gap-2 text-2xl font-bold">
                <MapPin className="size-6 text-primary" />
                {region}
                <span className="text-lg font-medium text-muted-foreground">
                  {list.length}개 코스
                </span>
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </section>
          );
        })}

        {courses.length === 0 && (
          <p className="mt-10 text-lg text-muted-foreground">
            코스를 준비 중입니다. 잠시 후 다시 확인해 주세요.
          </p>
        )}
      </div>
    </>
  );
}

function CourseCard({ course }: { course: Course }) {
  const min = carMinutes(course.totalKm);
  return (
    <Link
      href={coursePath(course.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {course.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.coverImage.replace(/^http:\/\//, "https://")}
          alt=""
          loading="lazy"
          className="h-36 w-full object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Route className="size-4 text-primary" />
        {course.city ? <span>{course.city}</span> : null}
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" />약 {min}분
        </span>
      </div>
      <h3 className="mt-2 flex-1 break-keep text-lg font-bold leading-snug group-hover:text-primary">
        {course.title}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {course.stops.map((s, i) => {
          const m = CATEGORIES[s.category];
          return (
            <span key={s.id} className="inline-flex items-center gap-1.5">
              {i > 0 ? (
                <ArrowRight className="size-4 text-muted-foreground" />
              ) : null}
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.label}
              </span>
            </span>
          );
        })}
      </div>
      </div>
    </Link>
  );
}
