/**
 * 나들로 사이트 전역 상수.
 * 브랜드 톤 규칙: "시니어/실버/노인" 금지 → '어른 · 신청년 · 나들이' 톤.
 */
export const siteConfig = {
  name: "나들로",
  nameRomanized: "nadeulro",
  url: "https://nadeulro.com",
  tagline: "지도 한 장이면, 오늘 나들이 준비 끝",
  description:
    "전국 파크골프장·온천·수영장·등산 명소의 위치와 정보를 카카오맵 기반 지도 한 장으로 보여주는 나들이 정보 사이트.",
  contactEmail: "tedevspace@gmail.com",
} as const;

export type NavItem = {
  title: string;
  href: string;
  description: string;
};

/** 주 내비게이션 (단순 1단계) */
export const mainNav: NavItem[] = [
  {
    title: "나들이 지도",
    href: "/map",
    description: "전국 3,000여 곳을 지도 한 장에서.",
  },
  {
    title: "나들이 코스",
    href: "/course",
    description: "파크골프 + 가까운 온천을 하루 코스로.",
  },
  {
    title: "파크골프장",
    href: "/parkgolf",
    description: "전국 파크골프장 위치·홀수·연락처.",
  },
  {
    title: "온천",
    href: "/hotspring",
    description: "수온·성분까지 확인하는 전국 온천.",
  },
  {
    title: "수영장",
    href: "/swim",
    description: "가까운 수영장을 지도에서 바로.",
  },
  {
    title: "등산",
    href: "/hiking",
    description: "동네 뒷산부터 명산까지 가볍게.",
  },
  {
    title: "수목원",
    href: "/arboretum",
    description: "전국 수목원·식물원·정원을 지도에서.",
  },
  {
    title: "블로그",
    href: "/blog",
    description: "파크골프·온천·수영·등산 나들이 이야기.",
  },
  {
    title: "이용 가이드",
    href: "/guide",
    description: "지도로 나들이 스팟 찾는 법 총정리.",
  },
];
