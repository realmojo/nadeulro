"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper } from "lucide-react";

import { CATEGORIES } from "@/lib/places";

/**
 * 모바일 전용 하단 탭바 — 앱처럼 엄지로 오가는 주 동선.
 * PC(md+)에서는 렌더링하지 않는다.
 */
export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: CATEGORIES.parkgolf.path,
      label: "파크골프",
      icon: <CategoryGlyph cat="parkgolf" />,
      active: pathname === CATEGORIES.parkgolf.path,
      color: CATEGORIES.parkgolf.color,
    },
    {
      href: CATEGORIES.hotspring.path,
      label: "온천",
      icon: <CategoryGlyph cat="hotspring" />,
      active: pathname === CATEGORIES.hotspring.path,
      color: CATEGORIES.hotspring.color,
    },
    {
      href: CATEGORIES.swim.path,
      label: "수영장",
      icon: <CategoryGlyph cat="swim" />,
      active: pathname === CATEGORIES.swim.path,
      color: CATEGORIES.swim.color,
    },
    {
      href: CATEGORIES.hiking.path,
      label: "등산",
      icon: <CategoryGlyph cat="hiking" />,
      active: pathname === CATEGORIES.hiking.path,
      color: CATEGORIES.hiking.color,
    },
    {
      href: "/blog",
      label: "블로그",
      icon: <Newspaper className="size-6" />,
      active: pathname.startsWith("/blog"),
      color: "var(--primary)",
    },
  ];

  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 md:hidden"
    >
      <ul className="grid h-16 grid-cols-5 pb-safe">
        {tabs.map((t) => (
          <li key={t.href} className="flex">
            <Link
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
              style={{ color: t.active ? t.color : "var(--muted-foreground)" }}
            >
              {t.icon}
              <span
                className={`text-[13px] leading-none ${t.active ? "font-bold" : "font-medium"}`}
              >
                {t.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CategoryGlyph({
  cat,
}: {
  cat: "parkgolf" | "hotspring" | "swim" | "hiking";
}) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <path d={CATEGORIES[cat].glyph} fill="currentColor" />
    </svg>
  );
}
