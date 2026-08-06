import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { siteConfig } from "@/lib/site";
import { TOOLS, TOOLS_INDEX } from "@/lib/tools";

export const metadata: Metadata = {
  title: TOOLS_INDEX.title,
  description: TOOLS_INDEX.description,
  alternates: { canonical: `${siteConfig.url}${TOOLS_INDEX.path}` },
  openGraph: {
    title: `${TOOLS_INDEX.title} | ${siteConfig.name}`,
    description: TOOLS_INDEX.description,
    url: `${siteConfig.url}${TOOLS_INDEX.path}`,
  },
};

/** 도구 묶음 자체를 목록으로 알린다 */
const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: TOOLS_INDEX.title,
  description: TOOLS_INDEX.description,
  itemListElement: TOOLS.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.title,
    url: `${siteConfig.url}${t.path}`,
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <article className="mx-auto w-full max-w-2xl px-4 py-4 md:py-8">
        <h1 className="font-display text-2xl font-bold leading-snug md:text-3xl">
          {TOOLS_INDEX.title}
        </h1>
        <p className="mt-3 break-keep text-lg leading-relaxed text-foreground/85">
          나들이에 쓸모 있는 계산과 기록을 도와주는 도구입니다. 설치도 로그인도
          필요 없고, 적은 내용은 사용하는 기기에만 남습니다.
        </p>

        <ul className="mt-8 grid gap-3">
          {TOOLS.map((t) => (
            <li key={t.key}>
              <Link
                href={t.path}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold">{t.title}</span>
                  <span className="mt-1 block break-keep text-base leading-relaxed text-foreground/80">
                    {t.blurb}
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground">
                    {t.when}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-6 shrink-0 text-muted-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
          도구에 입력한 내용은 서버로 전송되지 않습니다. 스코어카드 기록은
          브라우저에만 저장되고, 만든 코스는 공유 주소에만 담깁니다.
        </p>
      </article>
    </>
  );
}
