import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Database, HandHeart, MapPinned } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { fetchPlaces } from "@/lib/places-server";
import { CATEGORIES, CATEGORY_ORDER, type PlaceCategory } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "나들로 소개",
  description:
    "나들로는 전국 파크골프장·온천·수영장·등산 명소의 위치와 정보를 카카오맵 기반 지도 한 장으로 보여주는 나들이 정보 사이트입니다.",
  alternates: { canonical: `${siteConfig.url}/about` },
};

export default async function AboutPage() {
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

  return (
    <>
      <PageHeader
        eyebrow="ABOUT"
        title="나들로 이야기"
        description="지도 한 장이면, 오늘 나들이 준비 끝. 어른들의 하루 나들이를 더 쉽고 가볍게 만드는 것이 나들로의 목표입니다."
      />

      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        {/* 왜 만들었나 */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold">왜 만들었나요</h2>
          <p className="break-keep text-lg leading-relaxed text-foreground/85">
            파크골프장이 어디 있는지, 가까운 온천은 몇 시까지 하는지 — 정보는
            여기저기 흩어져 있고, 지자체마다 페이지도 제각각입니다. 막상
            나가려면 검색만 한참이죠.
          </p>
          <p className="break-keep text-lg leading-relaxed text-foreground/85">
            나들로는 이 흩어진 정보를 <b className="font-semibold text-foreground">지도 한 장</b>에
            모았습니다. 글씨는 크게, 버튼은 큼직하게. 복잡한 가입 없이, 열자마자
            내 주변부터 보여드립니다.
          </p>
        </section>

        {/* 무엇을 담았나 */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">무엇을 담았나요</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            지금 지도에 올라와 있는 실제 장소{" "}
            <b className="font-semibold text-foreground">
              {total > 0 ? `${total.toLocaleString()}곳` : "3,000여 곳"}
            </b>
            입니다.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                    <span className="block text-base text-muted-foreground">
                      {counts[key] > 0 ? `${counts[key].toLocaleString()}곳` : "준비 중"}
                    </span>
                  </span>
                  <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* 원칙 */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">지키는 원칙</h2>
          <div className="mt-5 space-y-4">
            {[
              {
                icon: <Compass className="size-6" />,
                title: "쉽고 크게",
                desc: "기본 글씨 18px 이상, 큼직한 버튼. 돋보기 없이도 편하게 보도록 만듭니다.",
              },
              {
                icon: <Database className="size-6" />,
                title: "공개 데이터 기반",
                desc: "각 지방자치단체·공공기관이 공개한 자료를 바탕으로 위치와 정보를 정리합니다.",
              },
              {
                icon: <MapPinned className="size-6" />,
                title: "바로 행동으로",
                desc: "위치를 확인했다면 전화·길찾기까지 한 번에. 검색에서 끝나지 않게 합니다.",
              },
              {
                icon: <HandHeart className="size-6" />,
                title: "참고용임을 분명히",
                desc: "운영시간·요금은 변할 수 있어요. 방문 전 확인을 늘 함께 안내합니다.",
              },
            ].map((p) => (
              <div key={p.title} className="flex gap-4 rounded-2xl border bg-card p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  {p.icon}
                </span>
                <div>
                  <p className="text-lg font-bold">{p.title}</p>
                  <p className="mt-1 break-keep text-base leading-relaxed text-muted-foreground">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 운영 */}
        <section className="mt-12 rounded-2xl bg-secondary/50 p-6">
          <h2 className="font-display text-2xl font-bold">운영</h2>
          <p className="mt-3 break-keep text-lg leading-relaxed text-foreground/85">
            나들로는 1인이 직접 만들고 운영하는 정보 사이트입니다. 잘못된 정보나
            빠진 곳을 발견하시면{" "}
            <Link href="/contact" className="font-semibold text-primary hover:underline">
              문의하기
            </Link>
            로 알려주세요. 확인 후 반영하겠습니다.
          </p>
        </section>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap gap-3">
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
            문의하기
          </Link>
        </div>
      </div>
    </>
  );
}
