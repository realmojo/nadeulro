/**
 * 나들이 스팟(장소) 공용 타입 · 카테고리 메타 · 마커 아트워크.
 * 클라이언트/서버 양쪽에서 안전하게 import 가능 (fetch 없음).
 */

export type PlaceCategory = "parkgolf" | "hotspring" | "swim" | "hiking";

export type PlaceAttributes = {
  /** 파크골프: 홀 수 */
  holes?: number;
  /** 파크골프: 운영 주체 */
  manager?: string;
  /** 온천: 수온 (예: "36.5°C") */
  temp?: string;
  /** 온천: 성분 (예: "Na-HCO3") */
  composition?: string;
  /** 온천: 운영 상태 */
  status?: string;
  /** 등산: 해발 높이(m) */
  height?: number;
  /** 등산: 부제(한 줄 소개) */
  subtitle?: string;
  /** 등산: 100대 명산 선정 사유(있으면 100대 명산) */
  top100_reason?: string;
  /** 등산: 관리 부서 */
  manage_dept?: string;
  /** 등산: 소재지 원문(행정구역 전체) */
  location_raw?: string;
  /** 등산: 대표 이미지 URL */
  image?: string;
  /** 공통: 데이터 출처(도메인) */
  source?: string;
  /** 공통: 출처 원본 식별자 */
  source_ref?: string;
  /** 공통: 데이터셋 표기 */
  dataset?: string;
  /** 공통: 좌표 확보 방식(디버그) */
  geocode_method?: string;
};

export type Place = {
  id: number;
  category: PlaceCategory;
  name: string;
  region: string | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  reserveUrl: string | null;
  /** 상세 설명(등산: 산 소개 본문) */
  description: string | null;
  attributes: PlaceAttributes;
};

export type PlacesPayload = {
  places: Place[];
  counts: Record<PlaceCategory, number>;
};

type CategoryMeta = {
  key: PlaceCategory;
  /** 전용 라우트 경로 (SEO) */
  path: string;
  /** 화면 라벨 */
  label: string;
  /** 짧은 라벨 (칩·탭) */
  short: string;
  /** 마커·배지용 단색 (hex — SVG 데이터 URI에 사용) */
  color: string;
  /** 어두운 획 색 (선택 상태 링 등) */
  colorDeep: string;
  /** 한 줄 소개 */
  blurb: string;
  /** 24×24 뷰박스 기준 글리프 path (흰색 채움) */
  glyph: string;
};

/**
 * 카테고리 메타. 순서 = 화면 노출 순서.
 * 색은 globals.css 의 --cat-* 토큰과 짝을 이룬다(마커는 hex 필요).
 */
export const CATEGORIES: Record<PlaceCategory, CategoryMeta> = {
  parkgolf: {
    key: "parkgolf",
    path: "/parkgolf",
    label: "파크골프장",
    short: "파크골프",
    color: "#337a54",
    colorDeep: "#215239",
    blurb: "9홀부터 90홀까지, 전국 잔디 위의 하루.",
    // 깃발 꽂힌 홀
    glyph:
      "M7 2.5c-.6 0-1 .4-1 1V20a1 1 0 1 0 2 0v-6.2l8.6-3.5c.9-.4.9-1.6 0-2L8 4.7V3.5c0-.6-.4-1-1-1Z",
  },
  hotspring: {
    key: "hotspring",
    path: "/hotspring",
    label: "온천",
    short: "온천",
    color: "#c9582f",
    colorDeep: "#8f3c1e",
    blurb: "몸이 풀리는 물, 수온과 성분까지 미리 확인.",
    // 온천 김 세 줄기 + 수면
    glyph:
      "M7.2 3.6c.5.9.4 1.7-.2 2.6-.7 1.1-.9 2.3-.2 3.6.3.5 1 .7 1.5.4.5-.3.6-.9.3-1.4-.4-.8-.3-1.4.3-2.3.8-1.2 1-2.6.2-4-.3-.5-1-.7-1.4-.4-.5.3-.7.9-.5 1.5Zm5 0c.5.9.4 1.7-.2 2.6-.7 1.1-.9 2.3-.2 3.6.3.5 1 .7 1.5.4.5-.3.6-.9.3-1.4-.4-.8-.3-1.4.3-2.3.8-1.2 1-2.6.2-4-.3-.5-1-.7-1.4-.4-.5.3-.7.9-.5 1.5Zm5 0c.5.9.4 1.7-.2 2.6-.7 1.1-.9 2.3-.2 3.6.3.5 1 .7 1.5.4.5-.3.6-.9.3-1.4-.4-.8-.3-1.4.3-2.3.8-1.2 1-2.6.2-4-.3-.5-1-.7-1.4-.4-.5.3-.7.9-.5 1.5ZM4 15.2c1.6-1.2 3.2-1.2 4.8 0 1.9 1.5 4.5 1.5 6.4 0 1.6-1.2 3.2-1.2 4.8 0v2.6c-1.6-1.2-3.2-1.2-4.8 0-1.9 1.5-4.5 1.5-6.4 0-1.6-1.2-3.2-1.2-4.8 0v-2.6Zm0 5c1.6-1.2 3.2-1.2 4.8 0 1.9 1.5 4.5 1.5 6.4 0 1.6-1.2 3.2-1.2 4.8 0v1.3H4v-1.3Z",
  },
  swim: {
    key: "swim",
    path: "/swim",
    label: "수영장",
    short: "수영장",
    color: "#38699f",
    colorDeep: "#254670",
    blurb: "실내·야외 수영장, 가까운 물부터 시원하게.",
    // 물결 두 줄
    glyph:
      "M2 9.8c2-1.6 4-1.6 6 0 2.4 1.9 5.6 1.9 8 0 2-1.6 4-1.6 6 0v3.4c-2-1.6-4-1.6-6 0-2.4 1.9-5.6 1.9-8 0-2-1.6-4-1.6-6 0V9.8Zm0 6.4c2-1.6 4-1.6 6 0 2.4 1.9 5.6 1.9 8 0 2-1.6 4-1.6 6 0v3.4c-2-1.6-4-1.6-6 0-2.4 1.9-5.6 1.9-8 0-2-1.6-4-1.6-6 0v-3.4Z",
  },
  hiking: {
    key: "hiking",
    path: "/hiking",
    label: "등산",
    short: "등산",
    color: "#82653f",
    colorDeep: "#5a4529",
    blurb: "동네 뒷산부터 이름난 명산까지, 가볍게 오르세요.",
    // 두 봉우리
    glyph:
      "M9.2 6.2 4 19h6l3.2-8-1.6-4.8c-.4-1.2-2-1.2-2.4 0ZM15.4 9.9 11.8 19H21l-3.4-9.1c-.4-1.1-1.9-1.1-2.2 0Z",
  },
};

export const CATEGORY_ORDER: PlaceCategory[] = [
  "parkgolf",
  "hotspring",
  "swim",
  "hiking",
];

/** 시도(광역) 목록 — 지역 필터 노출 순서(행정구역 통상 순) */
export const REGION_ORDER: string[] = [
  "서울",
  "경기",
  "인천",
  "강원",
  "충북",
  "충남",
  "대전",
  "세종",
  "전북",
  "전남",
  "광주",
  "경북",
  "경남",
  "대구",
  "울산",
  "부산",
  "제주",
];

export function isPlaceCategory(v: string | null | undefined): v is PlaceCategory {
  return v === "parkgolf" || v === "hotspring" || v === "swim" || v === "hiking";
}

/** 물방울(핀) 형태 마커 SVG — 카테고리 색 + 흰 글리프 */
export function markerSvg(cat: PlaceCategory, selected = false): string {
  const m = CATEGORIES[cat];
  const s = selected ? 1.35 : 1;
  const w = Math.round(34 * s);
  const h = Math.round(44 * s);
  const ring = selected
    ? `<circle cx="17" cy="15.4" r="15" fill="none" stroke="${m.colorDeep}" stroke-width="2.4"/>`
    : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 34 44">` +
    `<path d="M17 43C10.4 33.6 3 26.8 3 16.6 3 8.5 9.3 2 17 2s14 6.5 14 14.6C31 26.8 23.6 33.6 17 43Z" fill="${m.color}" stroke="white" stroke-width="2.2"/>` +
    ring +
    `<g transform="translate(6.2 5.2) scale(0.9)"><path d="${m.glyph}" fill="white"/></g>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** 마커 크기(px) — markerSvg 와 짝 */
export function markerSize(selected = false): { w: number; h: number } {
  const s = selected ? 1.35 : 1;
  return { w: Math.round(34 * s), h: Math.round(44 * s) };
}

/** 등산: 100대 명산 여부(선정 사유가 있으면 참) — 서버/클라이언트 공용 */
export function isTop100(p: Place): boolean {
  return p.category === "hiking" && Boolean(p.attributes.top100_reason);
}

/** 장소 상세 페이지 경로 (name 기반, 예: /hiking/가리산) */
export function placeDetailPath(
  category: PlaceCategory,
  name: string,
): string {
  return `${CATEGORIES[category].path}/${encodeURIComponent(name)}`;
}

/**
 * 상세 페이지 제목/메타 문구 — "지역 시군구 이름 코스 예약 정보".
 * (사이트명 접미 "| 나들로"는 layout 의 title.template 이 붙인다)
 */
export function placeHeading(
  p: Pick<Place, "region" | "city" | "name">,
): string {
  const where = [p.region, p.city, p.name].filter(Boolean).join(" ");
  return `${where} 코스 예약 정보`;
}

/** 지역별 랜딩 페이지 경로 (예: /parkgolf/region/서울) */
export function regionPath(category: PlaceCategory, region: string): string {
  return `${CATEGORIES[category].path}/region/${encodeURIComponent(region)}`;
}

/** 카카오맵 길찾기 링크 */
export function kakaoDirectionsUrl(p: Place): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
}

/** 카카오맵에서 보기 */
export function kakaoMapUrl(p: Place): string {
  return `https://map.kakao.com/link/map/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
}
