import Link from "next/link";

import { siteConfig } from "@/lib/site";

/**
 * 정보형 푸터 — 라벨 + 설명 행 구성.
 * (소개 / 바로가기 / 유의사항 / 하단 링크 / 저작권)
 */
export function SiteFooter() {
  const quickLinks = [
    { title: "나들이 지도", href: "/map" },
    { title: "파크골프장", href: "/parkgolf" },
    { title: "온천", href: "/hotspring" },
    { title: "수영장", href: "/swim" },
    { title: "등산", href: "/hiking" },
    { title: "이용 가이드", href: "/guide" },
  ];

  const subLinks = [
    { title: "나들로 소개", href: "/about" },
    { title: "이용 가이드", href: "/guide" },
    { title: "문의하기", href: "/contact" },
    { title: "개인정보처리방침", href: "/privacy" },
    { title: "이용약관", href: "/terms" },
  ];

  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-10 text-[15px] leading-relaxed">
        {/* 소개 */}
        <FooterRow label={siteConfig.name}>
          전국 파크골프장·온천·수영장·등산 명소 3,000여 곳의 실제 위치와 시설 정보를
          카카오맵 기반의 나들이 지도 한 장으로 보여주는 1인 운영 정보
          사이트입니다. 시설 정보는 각 지방자치단체·공공기관의 공개 자료를
          기반으로 하며, 지도 데이터와 함께 이용 가이드 같은 직접
          작성한 콘텐츠를 제공합니다.
        </FooterRow>

        {/* 바로가기 */}
        <FooterRow label="바로가기">
          <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-1.5">
            {quickLinks.map((l, i) => (
              <span key={l.href} className="inline-flex items-center gap-1">
                {i > 0 && (
                  <span aria-hidden="true" className="text-border">
                    ·
                  </span>
                )}
                <Link
                  href={l.href}
                  className="rounded px-1 py-0.5 text-foreground/80 hover:text-foreground hover:underline"
                >
                  {l.title}
                </Link>
              </span>
            ))}
          </span>
        </FooterRow>

        {/* 유의사항 */}
        <FooterRow label="유의사항">
          나들로가 제공하는 모든 시설·운영 정보는{" "}
          <strong className="font-semibold text-foreground">
            나들이 참고용 자료
          </strong>
          이며, 실제 운영시간·요금·휴무일과 다를 수 있습니다. 방문 전 해당
          시설에 직접 확인해 주시고, 정보 이용에 따른 최종 판단과 책임은
          이용자 본인에게 있습니다.
        </FooterRow>

        {/* 하단 링크 */}
        <nav aria-label="바닥 메뉴" className="mt-6">
          <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {subLinks.map((l, i) => (
              <li key={l.title} className="inline-flex items-center gap-1">
                {i > 0 && (
                  <span aria-hidden="true" className="text-border">
                    ·
                  </span>
                )}
                <Link
                  href={l.href}
                  className="inline-flex min-h-10 items-center rounded px-1.5 text-foreground/70 hover:text-foreground hover:underline"
                >
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <hr className="my-6 border-border" />

        {/* 운영 정보 · 저작권 */}
        <div className="space-y-2 text-muted-foreground">
          <p>
            운영 : {siteConfig.name}({siteConfig.nameRomanized}) ｜ 문의 :{" "}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="hover:underline"
            >
              {siteConfig.contactEmail}
            </a>
          </p>
          <p>
            © {new Date().getFullYear()} {siteConfig.name}의 모든 콘텐츠는
            저작권법의 보호를 받으며, 무단 전재·복사·배포 등을 금합니다.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-col gap-1 first:mt-0 md:flex-row md:gap-0">
      <span className="w-24 shrink-0 pt-0.5 font-bold text-foreground">
        {label}
      </span>
      <p className="break-keep text-muted-foreground">{children}</p>
    </div>
  );
}
