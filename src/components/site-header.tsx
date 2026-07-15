import Image from "next/image";
import Link from "next/link";
import { Map } from "lucide-react";

import { mainNav, siteConfig } from "@/lib/site";

/** PC=웹사이트 헤더 · 모바일=간결한 브랜드 바(주 동선은 하단 탭바) */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md px-1"
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
          <span className="font-display text-[26px] font-bold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        <nav aria-label="주 메뉴" className="hidden md:block">
          <ul className="flex items-center gap-0.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center rounded-md px-3 text-base font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/map"
          className="hidden min-h-11 items-center gap-2 rounded-xl bg-persimmon px-4 font-bold text-persimmon-foreground shadow-sm transition-transform hover:brightness-105 active:scale-[0.97] md:flex"
        >
          <Map className="size-5" />
          지도 열기
        </Link>

        {/* 모바일: 지도 바로가기 */}
        <Link
          href="/map"
          aria-label="나들이 지도 열기"
          className="flex size-11 items-center justify-center rounded-xl bg-persimmon text-persimmon-foreground shadow-sm md:hidden"
        >
          <Map className="size-6" />
        </Link>
      </div>
    </header>
  );
}
