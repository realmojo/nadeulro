import Link from "next/link";
import { Flag, Waves, Mountain, BedDouble, Route, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";

const categories = [
  {
    title: "파크골프",
    href: "/parkgolf",
    icon: Flag,
    role: "간판",
    desc: "전국 파크골프장을 지도에서 한눈에. 거리·홀수로 골라보세요.",
  },
  {
    title: "온천",
    href: "/onsen",
    icon: Waves,
    role: "휴식",
    desc: "라운딩 뒤 몸을 풀어주는 근처 온천을 코스에 넣어요.",
  },
  {
    title: "등산",
    href: "/guide",
    icon: Mountain,
    role: "자연",
    desc: "가볍게 걷기 좋은 자연·건강 코스로 이어집니다.",
  },
  {
    title: "숙박",
    href: "/stay",
    icon: BedDouble,
    role: "1박",
    desc: "온천·여행과 묶어 여유로운 1박 코스로 완성해요.",
  },
];

export default function Home() {
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

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-accent/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <Badge variant="secondary" className="mb-5 text-base">
            신청년을 위한 나들이 코스
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {siteConfig.tagline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
            파크골프 · 온천 · 등산 · 숙박을 하나의 하루 코스로 잇습니다. 오늘,
            가까운 곳에서 시작해 보세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/parkgolf">
                파크골프장 찾기
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/course">코스 묶음 보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 차별화 포인트: 코스 묶음 */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Route className="size-7" aria-hidden="true" />
              <CardTitle className="text-2xl text-primary-foreground">
                하나의 코스로 잇습니다
              </CardTitle>
            </div>
            <CardDescription className="text-primary-foreground/80">
              디렉터리 나열이 아니라, 하루의 흐름을 코스로 제안합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">
              ○○ 파크골프장에서 18홀 →{" "}
              <span className="font-semibold">차로 15분</span> → △△온천에서 휴식
              → 근처 □□ 맛집·숙박까지.
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link href="/course">
                오늘의 코스 보기
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* 카테고리 */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-6 text-2xl font-bold">무엇을 하러 나갈까요?</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.title}
                href={c.href}
                className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="h-full transition-colors group-hover:border-primary group-hover:bg-accent/40">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon
                        className="size-8 text-primary"
                        aria-hidden="true"
                      />
                      <Badge variant="outline">{c.role}</Badge>
                    </div>
                    <CardTitle className="mt-2">{c.title}</CardTitle>
                    <CardDescription>{c.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
