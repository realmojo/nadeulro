import type { Metadata } from "next";
import Link from "next/link";

import { MapScreen } from "@/components/map/map-screen";
import {
  CATEGORIES,
  placeDetailPath,
  regionPath,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import { fetchPlaces } from "@/lib/places-server";
import { fetchPosts } from "@/lib/blog-server";
import { blogCategoryPath, blogPostPath, type BlogPost } from "@/lib/blog";
import { siteConfig } from "@/lib/site";

/** 우측 패널용 카테고리 FAQ */
const SIDE_FAQ: Record<PlaceCategory, Array<{ q: string; a: string }>> = {
  parkgolf: [
    { q: "처음이라도 칠 수 있나요?", a: "네. 규칙이 단순하고 클럽 한 자루면 돼서 첫날 바로 한 게임을 돌 수 있습니다. 공영 구장은 대부분 무료이거나 소액입니다." },
    { q: "연락처는 어디서 보나요?", a: "각 파크골프장 상세페이지의 연락처를 확인하세요. 공영 구장은 관할 지자체 문화체육 부서로 문의할 수 있습니다." },
  ],
  hotspring: [
    { q: "예약이 필요한가요?", a: "대부분 예약 없이 이용합니다. 상세페이지의 전화로 운영시간을 미리 확인하면 좋습니다." },
    { q: "수질·수온은 어떻게 보나요?", a: "각 온천 상세페이지에서 수온과 성분(탄산·유황 등)을 확인할 수 있습니다." },
  ],
  swim: [
    { q: "실내·야외 중 뭘 고르나요?", a: "사계절 운동은 실내수영장, 여름 물놀이는 야외수영장이 좋습니다. 상세페이지에서 위치·연락처를 확인하세요." },
    { q: "강습도 있나요?", a: "시설마다 다릅니다. 초급반·아쿠아로빅 운영 여부는 전화로 문의하는 것이 정확합니다." },
  ],
  hiking: [
    { q: "초보도 오를 산이 있나요?", a: "낮고 완만한 산부터 시작하세요. 각 산 상세페이지에서 높이와 소개를 확인할 수 있습니다." },
    { q: "100대 명산은 어떻게 찾나요?", a: "등산 목록에서 100대 명산은 별도로 표시됩니다. 가까운 명산부터 도전해 보세요." },
  ],
};

/** 카테고리별 SEO 문구 */
const SEO: Record<
  PlaceCategory,
  { title: string; description: string; intro: string }
> = {
  parkgolf: {
    title: "전국 파크골프장 지도",
    description:
      "전국 파크골프장의 위치를 카카오맵에서 한눈에. 홀수·운영기관·연락처·예약 정보까지 확인하고 길찾기로 바로 출발하세요.",
    intro:
      "9홀 연습장부터 90홀 대형 구장까지, 전국의 파크골프장을 지도에서 찾아보세요. 홀수와 운영기관, 전화번호를 확인하고 카카오맵 길찾기로 바로 이동할 수 있습니다.",
  },
  hotspring: {
    title: "전국 온천 지도",
    description:
      "전국 온천의 위치·수온·성분을 카카오맵에서 한눈에. 몸이 풀리는 진짜 온천을 골라 전화 확인 후 바로 출발하세요.",
    intro:
      "수온과 성분(탄산·유황 등)까지 확인할 수 있는 전국 온천 지도입니다. 나들이 마무리로 몸을 풀기 좋은 가까운 온천을 찾아보세요.",
  },
  swim: {
    title: "전국 수영장 지도",
    description:
      "전국 실내·야외 수영장의 위치를 카카오맵에서 한눈에. 가까운 수영장을 찾아 길찾기로 바로 출발하세요.",
    intro:
      "동네 실내수영장부터 호텔 풀까지, 전국 수영장을 지도에서 찾아보세요. 위치 확인 후 카카오맵 길찾기로 바로 이동할 수 있습니다.",
  },
  hiking: {
    title: "전국 등산 명소 지도",
    description:
      "전국 산·봉우리 등산 명소의 위치를 카카오맵에서 한눈에. 동네 뒷산부터 이름난 명산까지 가볍게 올라보세요.",
    intro:
      "동네 뒷산부터 이름난 명산까지, 전국 등산 명소를 지도에서 찾아보세요. 위치를 확인하고 카카오맵 길찾기로 들머리까지 바로 이동할 수 있습니다.",
  },
};

/** 카테고리 페이지 메타데이터 (실제 장소 수 포함) */
export async function categoryMetadata(cat: PlaceCategory): Promise<Metadata> {
  const meta = CATEGORIES[cat];
  const seo = SEO[cat];
  let count = 0;
  try {
    count = (await fetchPlaces()).counts[cat] ?? 0;
  } catch {
    /* 카운트 실패 시 숫자 없이 진행 */
  }
  const title = count > 0 ? `${seo.title} — ${count.toLocaleString()}곳` : seo.title;
  return {
    title,
    description: seo.description,
    alternates: { canonical: `${siteConfig.url}${meta.path}` },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description: seo.description,
      url: `${siteConfig.url}${meta.path}`,
    },
  };
}

/** 카테고리 지도 페이지 본문 — 지도 + 크롤링 가능한 보조 콘텐츠 */
export async function CategoryMapPage({ category }: { category: PlaceCategory }) {
  const meta = CATEGORIES[category];
  const seo = SEO[category];

  let count = 0;
  let regions: Array<[string, number]> = [];
  let sample: Place[] = [];
  try {
    const { places, counts } = await fetchPlaces();
    count = counts[category] ?? 0;
    const byRegion = new Map<string, number>();
    for (const p of places) {
      if (p.category !== category || !p.region) continue;
      byRegion.set(p.region, (byRegion.get(p.region) ?? 0) + 1);
    }
    regions = [...byRegion.entries()].sort((a, b) => b[1] - a[1]);
    sample = places.filter((p) => p.category === category).slice(0, 20);
  } catch {
    /* SEO 보조 콘텐츠 없이도 지도는 뜬다 */
  }

  let posts: BlogPost[] = [];
  try {
    posts = await fetchPosts({ category, limit: 3 });
  } catch {
    /* 블로그 조회 실패 시 해당 섹션만 생략 */
  }

  const sidePanel = (
    <div className="px-5 py-6">
      <h2 className="font-display text-lg font-bold">{meta.label} 안내</h2>
      <p className="mt-2 break-keep text-sm leading-relaxed text-muted-foreground">
        {seo.intro}
      </p>
      {count > 0 ? (
        <p className="mt-2 text-sm">
          전국{" "}
          <b className="font-bold" style={{ color: meta.color }}>
            {count.toLocaleString()}곳
          </b>
        </p>
      ) : null}

      {regions.length > 0 ? (
        <section className="mt-6">
          <h3 className="text-sm font-bold text-foreground/80">지역별 바로가기</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {regions.slice(0, 14).map(([r, n]) => (
              <Link
                key={r}
                href={regionPath(category, r)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80 hover:bg-muted"
              >
                {r}
                <span className="text-muted-foreground">{n}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-bold text-foreground/80">나들이 이야기</h3>
            <Link
              href={blogCategoryPath(category)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              전체 보기
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={blogPostPath(p.category, p.slug)}
                  className="block rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40"
                >
                  <span className="block break-keep text-sm font-semibold leading-snug">
                    {p.title}
                  </span>
                  {p.excerpt ? (
                    <span className="mt-1 line-clamp-2 break-keep text-xs leading-relaxed text-muted-foreground">
                      {p.excerpt}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h3 className="text-sm font-bold text-foreground/80">자주 묻는 질문</h3>
        <dl className="mt-2 space-y-2">
          {SIDE_FAQ[category].map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border bg-card p-3 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-semibold">
                {f.q}
                <span className="text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-1.5 break-keep text-xs leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </dl>
      </section>

      <section className="mt-6 border-t pt-4 text-xs text-muted-foreground">
        <Link href="/blog" className="font-medium text-primary hover:underline">
          블로그
        </Link>{" "}
        ·{" "}
        <Link href="/guide" className="font-medium text-primary hover:underline">
          이용 가이드
        </Link>{" "}
        ·{" "}
        <Link href="/about" className="font-medium text-primary hover:underline">
          소개
        </Link>
      </section>
    </div>
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${seo.title}${count ? ` — ${count.toLocaleString()}곳` : ""}`,
    description: seo.description,
    url: `${siteConfig.url}${meta.path}`,
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MapScreen initialCategory={category} sideContent={sidePanel} />

      {/* 검색엔진·스크린리더용 보조 콘텐츠 (지도 뒤에 위치) */}
      <section className="sr-only">
        <h1>
          {seo.title}
          {count ? ` — 전국 ${count.toLocaleString()}곳` : ""}
        </h1>
        <p>{seo.intro}</p>
        {regions.length > 0 && (
          <>
            <h2>지역별 {meta.label}</h2>
            <ul>
              {regions.map(([r, n]) => (
                <li key={r}>
                  <Link href={regionPath(category, r)}>
                    {r} {meta.label} {n.toLocaleString()}곳
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        {sample.length > 0 && (
          <>
            <h2>대표 {meta.label}</h2>
            <ul>
              {sample.map((p) => (
                <li key={p.id}>
                  <Link href={placeDetailPath(p.category, p.slug)}>
                    {p.name}
                  </Link>
                  {p.address ? ` — ${p.address}` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
