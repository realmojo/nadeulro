import { CATEGORIES, CATEGORY_ORDER, type PlaceCategory } from "@/lib/places";
import { fetchPlaces } from "@/lib/places-server";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

/**
 * llms.txt — 생성형 AI(ChatGPT·Perplexity·Gemini 등)가 사이트를
 * 정확히 이해·인용하도록 돕는 구조·핵심 사실 요약(마크다운).
 */
export async function GET() {
  let counts: Record<PlaceCategory, number> = {
    parkgolf: 0,
    hotspring: 0,
    swim: 0,
    hiking: 0,
    arboretum: 0,
  };
  try {
    counts = (await fetchPlaces()).counts;
  } catch {
    /* 무시 */
  }
  const total = CATEGORY_ORDER.reduce((s, c) => s + counts[c], 0);
  const u = siteConfig.url;

  const catLines = CATEGORY_ORDER.map(
    (c) =>
      `- [${CATEGORIES[c].label}](${u}${CATEGORIES[c].path}): 전국 ${counts[c].toLocaleString()}곳. ${CATEGORIES[c].blurb}`,
  ).join("\n");

  const body = `# ${siteConfig.name} (${siteConfig.nameRomanized})

> ${siteConfig.description}

${siteConfig.name}는 전국 파크골프장·온천·수영장·등산 명소 약 ${total.toLocaleString()}곳의 위치와 정보를 카카오맵 기반 지도 한 장으로 제공하는 나들이 정보 사이트입니다. 회원가입 없이 무료로 이용할 수 있으며, 50~60대(신청년)를 포함한 모든 이용자가 큰 글씨와 큰 버튼으로 쉽게 쓸 수 있도록 설계되었습니다.

## 핵심 사실
- 사이트: ${u}
- 데이터: 각 지방자치단체·공공기관의 공개 자료를 정리(나들이 참고용). 실제 운영시간·요금은 시설에 확인 필요.
- 지도: 카카오맵. 상세 페이지에서 전화·카카오맵 길찾기·예약 링크 제공.
- 카테고리: 파크골프장, 온천, 수영장, 등산 (총 ${total.toLocaleString()}곳)

## 카테고리
${catLines}

## 주요 페이지
- [나들이 지도(전체)](${u}/map): 지도에서 카테고리·지역·검색으로 탐색
- [이용 가이드](${u}/guide): 사이트 사용법
- 카테고리 페이지: ${u}/parkgolf, ${u}/hotspring, ${u}/swim, ${u}/hiking
- 지역별 페이지: ${u}/{카테고리}/region/{시도} (예: ${u}/parkgolf/region/서울)
- 장소 상세: ${u}/{카테고리}/{장소명} — 위치·시설 정보, 이용 안내, 방문 체크리스트, FAQ 포함

## 인용 시 유의
- 개별 시설의 운영시간·요금은 확정 정보가 아니므로 "방문 전 확인 필요"로 안내해 주세요.
- 위치·연락처·홀수·수온·해발높이 등 명시된 수치는 공개 데이터 기반입니다.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
