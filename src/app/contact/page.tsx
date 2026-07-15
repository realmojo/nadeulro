import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageSquareWarning, PlusCircle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "문의하기",
  description:
    "나들로에 정보 수정·추가 요청이나 제휴 문의를 남겨주세요. 이메일로 받고 있습니다.",
  alternates: { canonical: `${siteConfig.url}/contact` },
};

const reasons = [
  {
    icon: <MessageSquareWarning className="size-6" />,
    title: "정보가 틀렸어요",
    desc: "위치·전화번호·운영시간이 실제와 다르면 알려주세요. 어느 장소인지 이름과 함께 적어주시면 빠릅니다.",
  },
  {
    icon: <PlusCircle className="size-6" />,
    title: "빠진 곳이 있어요",
    desc: "지도에 없는 파크골프장·온천·수영장·등산 명소를 제보해 주세요. 이름과 주소만 있어도 충분합니다.",
  },
  {
    icon: <MapPin className="size-6" />,
    title: "제휴·기타 문의",
    desc: "시설 등록, 데이터 활용, 광고·제휴 등 어떤 이야기든 편하게 남겨주세요.",
  },
];

export default function ContactPage() {
  const email = siteConfig.contactEmail;
  const mailto = `mailto:${email}?subject=${encodeURIComponent(
    "[나들로] 문의"
  )}`;

  return (
    <>
      <PageHeader
        eyebrow="CONTACT"
        title="문의하기"
        description="틀린 정보 신고, 빠진 장소 제보, 제휴 문의 — 무엇이든 이메일로 받고 있습니다."
      />

      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        {/* 이메일 카드 */}
        <div className="rounded-3xl border bg-card p-6 text-center shadow-sm md:p-8">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-primary">
            <Mail className="size-8" />
          </span>
          <p className="mt-4 text-lg text-muted-foreground">이메일로 보내주세요</p>
          <p className="font-display mt-1 break-all text-2xl font-bold md:text-3xl">
            {email}
          </p>
          <a
            href={mailto}
            className="mt-6 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-persimmon px-7 text-lg font-bold text-persimmon-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            <Mail className="size-5" />
            메일 쓰기
          </a>
          <p className="mt-4 text-base text-muted-foreground">
            보통 며칠 안에 확인하고 답장드립니다. (1인 운영이라 조금 늦을 수
            있어요.)
          </p>
        </div>

        {/* 어떤 문의 */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">이런 문의를 받아요</h2>
          <div className="mt-5 space-y-4">
            {reasons.map((r) => (
              <div key={r.title} className="flex gap-4 rounded-2xl border bg-card p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  {r.icon}
                </span>
                <div>
                  <p className="text-lg font-bold">{r.title}</p>
                  <p className="mt-1 break-keep text-base leading-relaxed text-muted-foreground">
                    {r.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 빠른 제보 팁 */}
        <section className="mt-10 rounded-2xl bg-secondary/50 p-6">
          <h2 className="font-display text-xl font-bold">더 빠르게 도와드리려면</h2>
          <p className="mt-2 break-keep text-lg leading-relaxed text-foreground/85">
            제보하실 때 <b className="font-semibold text-foreground">장소 이름</b>과{" "}
            <b className="font-semibold text-foreground">주소</b>(또는 대략적인
            위치)를 함께 적어주시면 확인이 훨씬 빠릅니다. 사진이 있으면 첨부해
            주셔도 좋아요.
          </p>
          <p className="mt-4 text-base text-muted-foreground">
            개인정보 처리에 대한 안내는{" "}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              개인정보처리방침
            </Link>
            을 참고해 주세요.
          </p>
        </section>
      </div>
    </>
  );
}
