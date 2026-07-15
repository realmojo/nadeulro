import Link from "next/link";

import { mainNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <p className="text-xl font-bold">{siteConfig.name}</p>
            <p className="mt-2 text-base text-muted-foreground">
              {siteConfig.tagline}
            </p>
          </div>

          <nav aria-label="바닥 메뉴">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-base text-foreground/80 hover:text-foreground hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          © {siteConfig.name} — 신청년의 나들이 코스 플랫폼.
        </p>
      </div>
    </footer>
  );
}
