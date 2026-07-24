import Link from "next/link";
import {
  ArrowRight,
  Car,
  MapPinned,
  Navigation,
  Newspaper,
  PhoneCall,
  Route,
} from "lucide-react";

import { fetchPlaces } from "@/lib/places-server";
import { fetchPosts } from "@/lib/blog-server";
import { fetchCourses } from "@/lib/course-server";
import { carMinutes, coursePath, type Course } from "@/lib/course";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  type PlaceCategory,
} from "@/lib/places";
import { PostCard } from "@/components/blog/post-card";
import type { BlogPost } from "@/lib/blog";
import { siteConfig } from "@/lib/site";

/** 장소 수는 천천히 변한다 — 1시간 재생성 */
export const revalidate = 3600;

export default async function Home() {
  let counts: Record<PlaceCategory, number> = {
    parkgolf: 0,
    hotspring: 0,
    swim: 0,
    hiking: 0,
    arboretum: 0,
  };
  try {
    counts = (await fetchPlaces()).counts;
  } catch {
    /* 카운트 실패 시에도 페이지는 뜬다 */
  }
  const total = CATEGORY_ORDER.reduce((s, c) => s + counts[c], 0);

  let posts: BlogPost[] = [];
  try {
    posts = await fetchPosts({ limit: 3 });
  } catch {
    /* 블로그 조회 실패 시 섹션만 생략 */
  }

  let courses: Course[] = [];
  try {
    // 이동이 짧은(동선이 촘촘한) 코스 6개를 대표로
    const all = await fetchCourses();
    courses = [...all]
      .sort((a, b) => (a.totalKm ?? 99) - (b.totalKm ?? 99))
      .slice(0, 6);
  } catch {
    /* 코스 조회 실패 시 섹션만 생략 */
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "ko-KR",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ============ 히어로 ============ */}
      <section className="bg-topo relative overflow-hidden border-b">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-accent/70 px-4 py-1.5 text-base font-semibold text-accent-foreground">
              전국 {total > 0 ? `${total.toLocaleString()}곳` : "3,000여 곳"}, 지도 한 장에
            </p>
            <h1 className="font-display mt-5 text-4xl font-bold leading-[1.22] tracking-tight md:text-6xl md:leading-[1.18]">
              지도 한 장이면,
              <br />
              오늘 나들이 준비 끝.
            </h1>
            <p className="mt-5 max-w-xl break-keep text-lg leading-relaxed text-muted-foreground md:text-xl">
              파크골프장 · 온천 · 수영장의 실제 위치와 정보를 한 지도에
              모았습니다. 가까운 곳을 고르고, 전화 한 통이면 준비 끝.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/map"
                className="inline-flex min-h-14 items-center gap-2.5 rounded-2xl bg-persimmon px-7 text-xl font-bold text-persimmon-foreground shadow-md transition-transform hover:brightness-105 active:scale-[0.98]"
              >
                <MapPinned className="size-6" />
                나들이 지도 열기
              </Link>
              <Link
                href="/parkgolf"
                className="inline-flex min-h-14 items-center gap-2 rounded-2xl border-2 border-primary/30 bg-card px-6 text-lg font-semibold text-primary transition-colors hover:bg-accent"
              >
                파크골프장부터 보기
                <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>

          {/* 미니 지도 일러스트 — 로고의 '길' 모티브 확장 */}
          <HeroMapCard total={total} />
        </div>
      </section>

      {/* ============ 카테고리 타일 ============ */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-18">
        <h2 className="font-display text-3xl font-bold">
          어디로 나갈까요?
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          숫자는 지금 지도에 올라와 있는 실제 장소 수예요.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_ORDER.map((key) => {
            const c = CATEGORIES[key];
            const n = counts[key];
            const ready = n > 0;
            return (
              <Link
                key={key}
                href={c.path}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ backgroundColor: c.color }}
                />
                <span
                  className="flex size-13 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${c.color}1f` }}
                >
                  <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
                    <path d={c.glyph} fill={c.color} />
                  </svg>
                </span>
                <p className="mt-4 text-xl font-bold">{c.label}</p>
                <p className="font-display mt-1 text-3xl font-bold" style={{ color: c.color }}>
                  {ready ? `${n.toLocaleString()}곳` : "준비 중"}
                </p>
                <p className="mt-2 break-keep text-base leading-relaxed text-muted-foreground">
                  {c.blurb}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-base font-semibold text-primary">
                  지도에서 보기
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ 나들이 코스 (차별점) ============ */}
      {courses.length > 0 && (
        <section className="border-y bg-accent/20">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-18">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  <Route className="size-4" />
                  나들로만의 코스
                </p>
                <h2 className="font-display mt-3 text-3xl font-bold">
                  하루가 하나의 코스로
                </h2>
                <p className="mt-2 max-w-xl break-keep text-lg text-muted-foreground">
                  장소만 찾지 마세요. 오전엔 파크골프, 오후엔 가까운 온천 —
                  동선까지 이어 드립니다.
                </p>
              </div>
              <Link
                href="/course"
                className="hidden shrink-0 items-center gap-1.5 rounded-xl border-2 border-primary/25 bg-card px-4 py-2.5 text-base font-semibold text-primary transition-colors hover:bg-accent sm:inline-flex"
              >
                코스 전체 보기
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <Link
                  key={c.id}
                  href={coursePath(c.slug)}
                  className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {c.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.coverImage.replace(/^http:\/\//, "https://")}
                      alt=""
                      loading="lazy"
                      className="h-36 w-full object-cover"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Car className="size-4 text-primary" />
                      {c.city ? <span>{c.city}</span> : null}
                      <span>· 이동 약 {carMinutes(c.totalKm)}분</span>
                    </div>
                    <p className="mt-2 flex-1 break-keep text-lg font-bold leading-snug group-hover:text-primary">
                      {c.title}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {c.stops.map((s, i) => {
                        const m = CATEGORIES[s.category];
                        return (
                          <span key={s.id} className="inline-flex items-center gap-1.5">
                            {i > 0 ? (
                              <ArrowRight className="size-3.5 text-muted-foreground" />
                            ) : null}
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
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
              ))}
            </div>

            <Link
              href="/course"
              className="mt-6 flex min-h-13 items-center justify-center gap-2 rounded-2xl border-2 border-primary/25 bg-card text-lg font-bold text-primary transition-colors hover:bg-accent sm:hidden"
            >
              <Route className="size-5" />
              나들이 코스 전체 보기
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </section>
      )}

      {/* ============ 사용 방법 ============ */}
      <section className="border-y bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-18">
          <h2 className="font-display text-3xl font-bold">
            쓰는 법은 세 걸음이면 충분해요
          </h2>
          <div className="relative mt-8 grid gap-6 md:grid-cols-3">
            {/* 연결 점선 (PC) */}
            <span
              aria-hidden="true"
              className="route-line absolute left-[12%] right-[12%] top-10 hidden text-primary/40 md:block"
              style={{ height: 3 }}
            />
            {[
              {
                icon: <MapPinned className="size-8" />,
                title: "지도를 연다",
                desc: "전국 지도를 열고 우리 동네로 이동해요. ‘내 주변’ 버튼이면 한 번에.",
              },
              {
                icon: <Navigation className="size-8" />,
                title: "가까운 곳을 고른다",
                desc: "파크골프·온천·수영장 중 오늘 기분에 맞는 곳을 골라요. 홀수·수온까지 미리 확인.",
              },
              {
                icon: <PhoneCall className="size-8" />,
                title: "전화하고 나선다",
                desc: "전화하기·길찾기 버튼이 큼직하게 붙어 있어요. 확인하고 바로 출발.",
              },
            ].map((s, i) => (
              <div
                key={s.title}
                className="relative rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    {s.icon}
                  </span>
                  <span className="font-display text-4xl font-bold text-primary/25">
                    {i + 1}
                  </span>
                </div>
                <p className="mt-4 text-xl font-bold">{s.title}</p>
                <p className="mt-2 break-keep text-base leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 나들이 이야기(블로그) ============ */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 md:py-18">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display flex items-center gap-2 text-3xl font-bold">
                <Newspaper className="size-7 text-primary" />
                나들이 이야기
              </h2>
              <p className="mt-2 break-keep text-lg text-muted-foreground">
                파크골프·온천·수영 입문과 이용 팁을 읽기 쉽게 정리했어요.
              </p>
            </div>
            <Link
              href="/blog"
              className="hidden shrink-0 items-center gap-1.5 rounded-xl border-2 border-primary/25 bg-card px-4 py-2.5 text-base font-semibold text-primary transition-colors hover:bg-accent sm:inline-flex"
            >
              전체 보기
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <Link
            href="/blog"
            className="mt-6 flex min-h-13 items-center justify-center gap-2 rounded-2xl border-2 border-primary/25 bg-card text-lg font-bold text-primary transition-colors hover:bg-accent sm:hidden"
          >
            <Newspaper className="size-5" />
            나들이 이야기 전체 보기
            <ArrowRight className="size-5" />
          </Link>
        </section>
      )}

      {/* ============ 마감 CTA ============ */}
      <section className="bg-topo bg-primary">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            오늘은 어디로 나들이 갈까요?
          </h2>
          <p className="mx-auto mt-3 max-w-xl break-keep text-lg leading-relaxed text-primary-foreground/85">
            좋은 계절은 기다려 주지 않아요. 가까운 곳부터 가볍게 다녀오세요.
          </p>
          <Link
            href="/map"
            className="mt-8 inline-flex min-h-14 items-center gap-2.5 rounded-2xl bg-persimmon px-8 text-xl font-bold text-persimmon-foreground shadow-lg transition-transform hover:brightness-105 active:scale-[0.98]"
          >
            <MapPinned className="size-6" />
            지도 열기
          </Link>
        </div>
      </section>
    </>
  );
}

/* 히어로 우측: 지도 카드 일러스트 (SDK 없이 가볍게) */
function HeroMapCard({ total }: { total: number }) {
  const pins: Array<{ cat: PlaceCategory; top: string; left: string; delay: string }> = [
    { cat: "parkgolf", top: "22%", left: "18%", delay: "0s" },
    { cat: "hotspring", top: "38%", left: "62%", delay: "0.15s" },
    { cat: "swim", top: "64%", left: "34%", delay: "0.3s" },
    { cat: "parkgolf", top: "72%", left: "74%", delay: "0.45s" },
  ];
  return (
    <div className="relative mx-auto hidden w-full max-w-md md:block" aria-hidden="true">
      <div className="bg-topo relative aspect-[4/5] overflow-hidden rounded-3xl border-2 border-primary/15 bg-card shadow-xl">
        {/* 코스 점선 */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 500"
          fill="none"
        >
          <path
            d="M86 132 C 150 190 240 150 262 216 C 282 276 160 300 150 342 C 142 378 220 400 300 382"
            stroke="var(--primary)"
            strokeOpacity="0.45"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="2 14"
          />
        </svg>
        {pins.map((p, i) => {
          const m = CATEGORIES[p.cat];
          return (
            <span
              key={i}
              className="absolute flex size-12 -translate-x-1/2 -translate-y-full flex-col items-center animate-bounce"
              style={{
                top: p.top,
                left: p.left,
                animationDuration: "2.6s",
                animationDelay: p.delay,
              }}
            >
              <span
                className="flex size-10 items-center justify-center rounded-full border-[3px] border-white shadow-lg"
                style={{ backgroundColor: m.color }}
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                  <path d={m.glyph} fill="white" />
                </svg>
              </span>
              <span
                className="-mt-[3px] size-2.5 rotate-45 border-b-[3px] border-r-[3px] border-white"
                style={{ backgroundColor: m.color }}
              />
            </span>
          );
        })}
        {/* 하단 요약 바 */}
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border bg-background/95 px-5 py-3.5 shadow-md backdrop-blur">
          <span className="text-base font-bold">이 지역 나들이 스팟</span>
          <span className="font-display text-xl font-bold text-primary">
            {(total || 3078).toLocaleString()}곳
          </span>
        </div>
      </div>
    </div>
  );
}
