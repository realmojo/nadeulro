/**
 * 나들로 사이트 전역 상수.
 * 브랜드 톤 규칙: "시니어/실버/노인" 금지 → '어른 · 신청년 · 나들이' 톤.
 */
export const siteConfig = {
  name: "나들로",
  nameRomanized: "nadeulro",
  url: "https://nadeulro.com",
  tagline: "파크골프·온천·등산·숙박까지, 오늘 뭐하지?",
  description:
    "파크골프·온천·수영·등산·숙박을 하나의 하루 코스로 잇는 여가·나들이 플랫폼. 신청년(50~60대)을 위한 코스 추천.",
} as const;

export type NavItem = {
  title: string;
  href: string;
  description: string;
};

/** 주 내비게이션 (단순 1~2단계) */
export const mainNav: NavItem[] = [
  {
    title: "파크골프장 찾기",
    href: "/parkgolf",
    description: "지도에서 가까운 파크골프장을 찾아보세요.",
  },
  {
    title: "코스 묶음",
    href: "/course",
    description: "파크골프 + 온천 + 맛집/숙박을 하루·1박 코스로.",
  },
  {
    title: "입문 가이드",
    href: "/guide",
    description: "파크골프란 · 비용 · 장비 · 규칙 총정리.",
  },
  {
    title: "온천",
    href: "/onsen",
    description: "몸이 풀리는 온천, 코스와 함께.",
  },
  {
    title: "숙박",
    href: "/stay",
    description: "온천·여행과 묶는 1박 코스 숙소.",
  },
];
