import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "파크골프 입문 가이드",
  description:
    "파크골프란 무엇인지, 비용·장비·규칙까지. 처음 시작하는 어른을 위한 입문 가이드.",
};

const topics = [
  {
    title: "파크골프란?",
    desc: "공원(park)에서 즐기는 골프. 작은 공과 하나의 클럽으로 누구나 쉽게 시작합니다.",
  },
  {
    title: "비용",
    desc: "대부분의 공영 파크골프장은 무료이거나 소액. 입문 장비 세트는 8~15만 원대.",
  },
  {
    title: "장비",
    desc: "클럽 1개, 공, 티가 기본. 입문 세트로 충분히 시작할 수 있습니다.",
  },
  {
    title: "규칙",
    desc: "9홀·18홀 라운드. 홀마다 정해진 타수 안에 넣는 것이 목표입니다.",
  },
];

// AEO: 사람들이 말로 묻는 문장을 그대로 질문으로, 40~60자 직답 먼저.
const faqs = [
  {
    q: "파크골프는 몇 살부터 할 수 있나요?",
    a: "나이 제한이 없습니다. 체력 부담이 적어 50~60대 신청년에게 특히 인기가 많습니다.",
  },
  {
    q: "파크골프 장비는 얼마인가요?",
    a: "입문 세트 기준 8~15만 원대면 시작할 수 있습니다. 클럽 1개·공·티가 기본입니다.",
  },
  {
    q: "파크골프장은 예약이 필요한가요?",
    a: "대부분 공영 파크골프장은 예약 없이 이용합니다. 지역·시간대에 따라 다를 수 있습니다.",
  },
];

export default function GuidePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageHeader
        eyebrow="입문 가이드"
        title="파크골프, 오늘 처음이어도 괜찮아요"
        description="파크골프란 무엇인지부터 비용·장비·규칙까지 한 번에 정리했습니다."
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {topics.map((t) => (
            <Card key={t.title}>
              <CardHeader>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold">자주 묻는 질문</h2>
          <dl className="space-y-4">
            {faqs.map((f) => (
              <Card key={f.q}>
                <CardContent className="pt-6">
                  <dt className="text-lg font-semibold">{f.q}</dt>
                  <dd className="mt-2 text-base text-muted-foreground">
                    {f.a}
                  </dd>
                </CardContent>
              </Card>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
