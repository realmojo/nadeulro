import type { Metadata, Viewport } from "next";
import { Gowun_Batang, IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";

import { Analytics } from "@/components/analytics";
import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteConfig } from "@/lib/site";
import "./globals.css";

/**
 * 본문 기본 폰트 — IBM Plex Sans KR.
 * 한글 글리프는 수백 개 unicode-range 청크로 쪼개져 제공된다. preload 를 켜면 그 수백
 * 개가 전부 <link preload> 로 주입되어 오히려 성능이 나빠지므로 preload:false 로 두고,
 * 브라우저가 화면에 필요한 청크만 지연 로드하도록 한다(CJK 폰트 표준 처리).
 */
const plexSans = IBM_Plex_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
  preload: false,
});

/** 디스플레이 세리프 — 제목·브랜드 순간에만 사용 (한글 명조). CJK 라 preload:false. */
const batang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-batang",
  display: "swap",
  preload: false,
});

/** 고정폭 — 숫자·코드 (홀수/거리/좌표 등) */
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "파크골프",
    "파크골프장",
    "온천",
    "수영장",
    "등산",
    "나들이",
    "여가",
    "신청년",
    "지도",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  other: {
    "google-adsense-account": "ca-pub-9130836798889522",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1c231e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${plexSans.variable} ${batang.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          본문 바로가기
        </a>
        <SiteHeader />
        <main id="main" className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <SiteFooter />
        <BottomNav />
        <Analytics />
      </body>
    </html>
  );
}
