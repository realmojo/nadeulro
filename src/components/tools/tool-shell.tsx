import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AdUnit } from "@/components/ad-unit";
import { adsense, siteConfig } from "@/lib/site";
import { TOOLS_INDEX, type Tool } from "@/lib/tools";

/** 도구 페이지 공용 메타데이터 */
export function toolMetadata(tool: Tool): Metadata {
  const url = `${siteConfig.url}${tool.path}`;
  return {
    title: tool.metaTitle,
    description: tool.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${tool.metaTitle} | ${siteConfig.name}`,
      description: tool.description,
      url,
    },
  };
}

/**
 * 도구 JSON-LD.
 * 무료 웹 도구는 SoftwareApplication + 가격 0 이 표준 표기다.
 */
function toolJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    description: tool.description,
    url: `${siteConfig.url}${tool.path}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    browserRequirements: "최신 웹 브라우저",
    inLanguage: "ko-KR",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

function breadcrumbJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: siteConfig.name,
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: TOOLS_INDEX.title,
        item: `${siteConfig.url}${TOOLS_INDEX.path}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.title,
        item: `${siteConfig.url}${tool.path}`,
      },
    ],
  };
}

/** 도구 페이지 껍데기 — 제목·설명·구조화 데이터 + 본문 슬롯 */
export function ToolShell({
  tool,
  children,
  /** 도구 아래에 붙는 설명 콘텐츠 (사용법·주의사항) */
  footer,
}: {
  tool: Tool;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(tool)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(tool)),
        }}
      />

      <article className="mx-auto w-full max-w-2xl px-4 py-4 md:py-8">
        {/* 광고: 콘텐츠 최상단 */}
        <AdUnit slot={adsense.slots.top} className="mb-4" />

        <div className="flex items-center gap-2">
          <Link
            href={TOOLS_INDEX.path}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="도구 목록으로"
          >
            <ArrowLeft className="size-6" />
          </Link>
          <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
            무료 도구
          </span>
        </div>

        <h1 className="font-display mt-4 text-2xl font-bold leading-snug md:text-3xl">
          {tool.title}
        </h1>
        <p className="mt-3 break-keep text-lg leading-relaxed text-foreground/85">
          {tool.blurb}
        </p>

        {/* 광고: 제목 아래 */}
        <AdUnit slot={adsense.slots.belowTitle} className="mt-4" />

        {children}

        {footer}

        {/* 광고: 본문 하단 */}
        <AdUnit slot={adsense.slots.bottom} className="mt-8" />
      </article>
    </>
  );
}
