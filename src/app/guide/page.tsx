import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Layers,
  LocateFixed,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { fetchPlaces } from "@/lib/places-server";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  REGION_ORDER,
  type PlaceCategory,
} from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "이용 가이드",
  description:
    "나들로 사용법 안내 — 지도에서 파크골프장·온천·수영장·등산 명소를 카테고리·지역으로 찾고, 전화·길찾기로 바로 나서는 방법을 한눈에 정리했습니다.",
  alternates: { canonical: `${siteConfig.url}/guide` },
};

// AEO: 사이트 이용에 대해 실제로 묻는 문장을 그대로 질문으로, 40~60자 직답 먼저.
const faqs = [
  {
    q: "나들로는 회원가입을 해야 하나요?",
    a: "아니요. 가입·로그인 없이 누구나 무료로 이용할 수 있습니다. 지도를 열면 바로 시작됩니다.",
  },
  {
    q: "이용 요금이 있나요?",
    a: "나들로 이용은 완전 무료입니다. 다만 방문하는 시설의 이용료는 각 시설 정책을 따릅니다.",
  },
  {
    q: "내 주변 장소는 어떻게 보나요?",
    a: "지도의 ‘내 위치로 보기’를 누르고 위치를 허용하면 현재 위치 주변부터 보여드립니다.",
  },
  {
    q: "길찾기는 어떻게 하나요?",
    a: "장소를 누르면 나오는 상세 카드에서 ‘카카오맵 길찾기’ 버튼을 누르면 바로 안내됩니다.",
  },
  {
    q: "정보가 실제와 달라요. 어떻게 알리나요?",
    a: "운영시간·요금은 변할 수 있어요. 문의하기로 장소 이름과 함께 알려주시면 확인해 반영합니다.",
  },
];

export default async function GuidePage() {
  let counts: Record<PlaceCategory, number> = {
    parkgolf: 0,
    hotspring: 0,
    swim: 0,
    hiking: 0,
  };
  try {
    counts = (await fetchPlaces()).counts;
  } catch {
    /* 카운트 실패해도 페이지는 뜬다 */
  }
  const total = CATEGORY_ORDER.reduce((s, c) => s + counts[c], 0);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const steps = [
    {
      icon: <MapPinned className="size-8" />,
      title: "지도를 연다",
      desc: "위의 ‘지도 열기’를 누르면 전국 나들이 지도가 열립니다. 위치를 허용하면 내 주변부터 보여드려요.",
    },
    {
      icon: <SlidersHorizontal className="size-8" />,
      title: "골라서 좁힌다",
      desc: "파크골프·온천·수영장·등산 중 하나를 고르고, 지역(시도)이나 검색어로 원하는 곳만 남겨요.",
    },
    {
      icon: <Phone className="size-8" />,
      title: "확인하고 나선다",
      desc: "마음에 드는 곳을 누르면 전화·길찾기 버튼이 큼직하게. 확인하고 바로 출발하세요.",
    },
  ];

  const finds = [
    {
      icon: <Layers className="size-6" />,
      title: "무엇을 할지 고르기",
      desc: "화면 위쪽 칩에서 파크골프장·온천·수영장·등산을 골라 그 종류만 지도에 남깁니다. ‘전체’를 누르면 모두 함께 보입니다.",
    },
    {
      icon: <MapPin className="size-6" />,
      title: "지역으로 좁히기",
      desc: `서울·경기·강원·부산 등 ${REGION_ORDER.length}개 시도 칩으로 한 지역만 골라볼 수 있어요. 고르면 지도가 그 지역으로 이동합니다.`,
    },
    {
      icon: <Search className="size-6" />,
      title: "이름·지역으로 검색",
      desc: "검색창에 장소 이름이나 동네를 적으면 전국에서 바로 찾아줍니다. (예: 여의도, 온양, 삼락)",
    },
    {
      icon: <LocateFixed className="size-6" />,
      title: "내 주변 보기",
      desc: "‘내 위치로 보기’를 누르고 위치를 허용하면, 지금 계신 곳 주변의 나들이 스팟만 모아 보여드립니다.",
    },
  ];

  const detailActions = [
    {
      icon: <Navigation className="size-6" />,
      title: "카카오맵 길찾기",
      desc: "누르면 카카오맵으로 연결돼 현재 위치에서 가는 길을 안내합니다.",
    },
    {
      icon: <Phone className="size-6" />,
      title: "전화하기",
      desc: "휴대폰이라면 번호를 눌러 바로 통화. 운영시간·예약을 미리 확인하기 좋아요.",
    },
    {
      icon: <ExternalLink className="size-6" />,
      title: "예약·홈페이지",
      desc: "예약 페이지가 있는 곳은 버튼으로 바로 연결됩니다. (일부 시설만 제공)",
    },
    {
      icon: <MapPin className="size-6" />,
      title: "정보 확인",
      desc: "홀 수(파크골프)·수온과 성분(온천)·해발 높이(등산) 등 종류별 정보와 주소를 확인할 수 있어요.",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageHeader
        eyebrow="이용 가이드"
        title="나들로, 이렇게 쓰세요"
        description={`지도 한 장으로 전국 ${
          total > 0 ? `${total.toLocaleString()}곳` : "3,000여 곳"
        }의 나들이 스팟을 찾는 방법을 처음부터 차근차근 안내합니다.`}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* 3단계 요약 */}
        <section>
          <h2 className="font-display text-2xl font-bold">세 걸음이면 충분해요</h2>
          <div className="relative mt-6 grid gap-6 md:grid-cols-3">
            <span
              aria-hidden="true"
              className="route-line absolute left-[14%] right-[14%] top-10 hidden text-primary/40 md:block"
              style={{ height: 3 }}
            />
            {steps.map((s, i) => (
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
        </section>

        {/* 지도에서 찾는 방법 */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">지도에서 이렇게 찾아요</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            네 가지 방법을 섞어 쓰면 원하는 곳을 빠르게 좁힐 수 있어요.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {finds.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl border bg-card p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  {f.icon}
                </span>
                <div>
                  <p className="text-lg font-bold">{f.title}</p>
                  <p className="mt-1 break-keep text-base leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 카테고리 안내 */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">
            무엇을 찾을 수 있나요
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            숫자는 지금 지도에 올라와 있는 실제 장소 수예요. 눌러서 바로 지도로
            이동할 수 있습니다.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {CATEGORY_ORDER.map((key) => {
              const c = CATEGORIES[key];
              return (
                <Link
                  key={key}
                  href={c.path}
                  className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/40"
                >
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${c.color}1f` }}
                  >
                    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
                      <path d={c.glyph} fill={c.color} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold">{c.label}</span>
                    <span className="block break-keep text-base text-muted-foreground">
                      {c.blurb}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className="font-display block text-xl font-bold"
                      style={{ color: c.color }}
                    >
                      {counts[key] > 0 ? counts[key].toLocaleString() : "준비 중"}
                    </span>
                    <span className="block text-sm text-muted-foreground">곳</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 장소를 고르면 */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">장소를 고르면</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            지도에서 장소를 누르면 상세 카드가 열리고, 여기서 바로 행동할 수
            있어요.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {detailActions.map((a) => (
              <div key={a.title} className="flex gap-4 rounded-2xl border bg-card p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  {a.icon}
                </span>
                <div>
                  <p className="text-lg font-bold">{a.title}</p>
                  <p className="mt-1 break-keep text-base leading-relaxed text-muted-foreground">
                    {a.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 알아두면 좋은 점 */}
        <section className="mt-14 rounded-2xl bg-secondary/50 p-6">
          <h2 className="font-display text-xl font-bold">알아두면 좋아요</h2>
          <ul className="mt-3 space-y-2.5">
            {[
              "정보는 나들이 참고용이에요. 운영시간·요금·휴무는 바뀔 수 있으니 방문 전 전화로 한 번 확인하시면 헛걸음이 없습니다.",
              "위치 정보는 지도를 내 주변으로 옮기는 데에만 쓰이고, 서버에 저장하지 않습니다.",
              "지도는 카카오맵을 사용해요. 길찾기 버튼도 카카오맵으로 바로 연결됩니다.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60"
                />
                <span className="break-keep text-base leading-relaxed text-foreground/85">
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">자주 묻는 질문</h2>
          <dl className="mt-6 space-y-3">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border bg-card p-5">
                <dt className="text-lg font-bold">{f.q}</dt>
                <dd className="mt-2 break-keep text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/map"
            className="inline-flex min-h-13 items-center gap-2 rounded-2xl bg-persimmon px-6 text-lg font-bold text-persimmon-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            <MapPinned className="size-5" />
            나들이 지도 열기
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-13 items-center gap-2 rounded-2xl border-2 border-primary/30 bg-card px-6 text-lg font-semibold text-primary transition-colors hover:bg-accent"
          >
            정보 제보·문의
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </>
  );
}
