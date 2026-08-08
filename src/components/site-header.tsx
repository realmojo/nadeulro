import Image from "next/image";
import Link from "next/link";
import { Map } from "lucide-react";

import { mainNav, siteConfig } from "@/lib/site";

/** PC=웹사이트 헤더 · 모바일=간결한 브랜드 바(주 동선은 하단 탭바) */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md px-1"
        >
          <Image
            src="/logo-mark.svg"
            alt=""
            width={34}
            height={34}
            className="size-8.5 rounded-lg"
            aria-hidden="true"
            priority
          />
          <span className="font-display whitespace-nowrap text-[22px] font-bold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        {/*
          한글 메뉴 10개 + 브랜드 + CTA 는 1024px 미만에서 한 줄에 들어가지 않는다.
          좁은 화면은 하단 탭바(BottomNav)가 주 동선이므로 헤더 메뉴는 lg 부터,
          보조 항목(수목원·블로그·이용 가이드)은 xl 부터 노출한다.
        */}
        <nav aria-label="주 메뉴" className="hidden min-w-0 lg:block">
          <ul className="flex items-center">
            {mainNav.map((item) => (
              <li
                key={item.href}
                className={
                  item.priority === "secondary" ? "hidden xl:block" : undefined
                }
              >
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center whitespace-nowrap rounded-md px-2.5 text-[15px] font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/map"
          className="hidden min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-persimmon px-4 text-[15px] font-bold text-persimmon-foreground shadow-sm transition-transform hover:brightness-105 active:scale-[0.97] lg:flex"
        >
          <Map className="size-5" />
          지도 열기
        </Link>

        {/* 모바일: 지도 바로가기 */}
        <Link
          href="/map"
          aria-label="나들이 지도 열기"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-persimmon text-persimmon-foreground shadow-sm lg:hidden"
        >
          <Map className="size-6" />
        </Link>
      </div>
    </header>
  );
}
