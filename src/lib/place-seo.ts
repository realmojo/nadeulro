/**
 * 상세 페이지 AEO(FAQ) 문구 생성 — 순수 함수(fetch 없음). 사실만 사용.
 * 서버 컴포넌트에서 렌더해 초기 HTML + FAQPage JSON-LD 에 함께 넣는다.
 */
import { CATEGORIES, type Place } from "@/lib/places";

export type Faq = { q: string; a: string };

function loc(p: Place): string {
  return [p.region, p.city].filter(Boolean).join(" ");
}

/** 장소별 자주 묻는 질문 3~5개 (있는 사실로만) */
export function buildFaqs(p: Place): Faq[] {
  const label = CATEGORIES[p.category].label;
  const where = loc(p);
  const faqs: Faq[] = [];

  // 위치
  if (where) {
    faqs.push({
      q: `${p.name}은(는) 어디에 있나요?`,
      a: `${p.name}은(는) ${where}${p.address ? ` (${p.address})` : ""}에 있는 ${label}입니다.`,
    });
  }

  // 카테고리별 핵심 사실
  const a = p.attributes;
  if (p.category === "parkgolf" && a.holes) {
    faqs.push({
      q: `${p.name}은(는) 몇 홀인가요?`,
      a: `${a.holes}홀 규모입니다.${a.manager ? ` ${a.manager}에서 운영합니다.` : ""}`,
    });
  }
  if (p.category === "hotspring") {
    if (a.temp && a.temp !== "-") {
      faqs.push({
        q: `${p.name}의 수온은 어떻게 되나요?`,
        a: `온천수 수온은 ${a.temp}입니다.${a.composition && a.composition !== "-" ? ` 수질 성분은 ${a.composition}입니다.` : ""}`,
      });
    }
  }
  if (p.category === "hiking" && a.height) {
    faqs.push({
      q: `${p.name}의 높이는 얼마인가요?`,
      a: `해발 ${a.height.toLocaleString()}m입니다.${
        a.top100_reason ? " 산림청 선정 100대 명산입니다." : ""
      }`,
    });
  }

  // 연락처
  if (p.phone) {
    faqs.push({
      q: `${p.name} 전화번호는 무엇인가요?`,
      a: `전화번호는 ${p.phone}입니다. 방문 전 운영시간을 확인해 보세요.`,
    });
  }

  // 예약
  if (p.category === "parkgolf") {
    faqs.push({
      q: `${p.name}은(는) 예약이 필요한가요?`,
      a: p.reserveUrl
        ? `온라인 예약 페이지가 제공됩니다. 이용 전 예약 여부와 운영시간을 확인하세요.`
        : `공영 파크골프장은 예약 없이 이용하는 경우가 많지만, 지역·시간대에 따라 다를 수 있어 방문 전 전화 확인을 권합니다.`,
    });
  }

  // 길찾기 (항상)
  if (p.lat != null && p.lng != null) {
    faqs.push({
      q: `${p.name} 가는 길은 어떻게 찾나요?`,
      a: `나들로 상세 페이지의 ‘카카오맵 길찾기’ 버튼을 누르면 현재 위치에서 가는 길이 안내됩니다.`,
    });
  }

  return faqs.slice(0, 5);
}

/* ============================================================
 * 가이드형 아티클 섹션 생성 (순수 함수, 사실만)
 * 없는 정보(정확한 운영시간·요금)는 지어내지 않고 일반 안내로 처리.
 * ========================================================== */

/** 위치·시설 정보 표 행 */
export function facilityRows(p: Place): Array<{ label: string; value: string }> {
  const a = p.attributes;
  const rows: Array<{ label: string; value: string }> = [];
  if (p.address) rows.push({ label: "주소", value: p.address });
  else if (a.location_raw) rows.push({ label: "소재지", value: a.location_raw });
  const where = loc(p);
  if (where) rows.push({ label: "지역", value: where });

  if (p.category === "parkgolf") {
    if (a.holes) rows.push({ label: "규모", value: `${a.holes}홀` });
    if (a.manager) rows.push({ label: "운영기관", value: a.manager });
    rows.push({ label: "이용요금", value: "대부분 무료 또는 소액 (방문 전 확인)" });
    rows.push({ label: "운영시간", value: "보통 일출~일몰 (계절·구장별 상이)" });
  } else if (p.category === "hotspring") {
    if (a.temp && a.temp !== "-") rows.push({ label: "수온", value: a.temp });
    if (a.composition && a.composition !== "-")
      rows.push({ label: "수질 성분", value: a.composition });
    if (a.status && a.status !== "-") rows.push({ label: "운영 상태", value: a.status });
    rows.push({ label: "이용요금", value: "시설별 상이 (방문 전 확인)" });
  } else if (p.category === "swim") {
    rows.push({ label: "이용요금", value: "시설별 상이 (방문 전 확인)" });
    rows.push({ label: "운영시간", value: "자유수영·강습 시간 시설별 상이 (전화 확인)" });
  } else if (p.category === "hiking") {
    if (a.height) rows.push({ label: "높이", value: `해발 ${a.height.toLocaleString()}m` });
    if (a.top100_reason) rows.push({ label: "선정", value: "산림청 100대 명산" });
  }
  if (p.phone) rows.push({ label: "연락처", value: p.phone });
  return rows;
}

/** 이용/예약 안내 도입 문장 */
export function usageIntro(p: Place): string {
  const a = p.attributes;
  const where = loc(p);
  if (p.category === "parkgolf") {
    const size = a.holes ? `${a.holes}홀 규모의 ` : "";
    const mgr = a.manager ? ` ${a.manager}에서 운영합니다.` : "";
    const rsv = p.reserveUrl
      ? " 온라인 예약 페이지가 제공되므로, 이용 전 예약 여부와 운영시간을 확인해 두면 좋습니다."
      : " 공영 파크골프장은 별도 예약 없이 선착순으로 이용하는 경우가 많지만, 주말·오전에는 대기가 있을 수 있어 방문 전 전화 확인을 권합니다.";
    return `${p.name}은(는) ${where}에 있는 ${size}파크골프장입니다.${mgr}${rsv}`;
  }
  if (p.category === "hotspring") {
    const t =
      a.temp && a.temp !== "-"
        ? ` 온천수 수온은 ${a.temp}${a.composition && a.composition !== "-" ? `, 수질은 ${a.composition} 성분` : ""}입니다.`
        : "";
    return `${p.name}은(는) ${where}에 위치한 온천입니다.${t} 목욕·온천 이용 시간과 요금은 시설마다 다르므로 방문 전 확인하세요.`;
  }
  if (p.category === "swim") {
    return `${p.name}은(는) ${where}에 있는 수영장입니다. 실내·야외 여부, 자유수영 가능 시간, 강습 운영은 시설마다 다르니 방문 전 전화로 자유수영 시간을 확인하는 것이 좋습니다.`;
  }
  // hiking
  const h = a.height ? ` 해발 ${a.height.toLocaleString()}m의 산으로,` : "";
  return `${p.name}은(는) ${where}에 위치한 산입니다.${h} 아래에서 소개와 등산 시 유의사항을 확인하고, 기상과 일몰 시각을 고려해 여유 있게 산행을 계획하세요.`;
}

/** 이용 시 주의사항 리스트 */
export function usageNotes(p: Place): string[] {
  switch (p.category) {
    case "parkgolf":
      return [
        "파크골프 전용 클럽·공을 준비하거나 현장 대여 여부를 확인하세요.",
        "잔디 보호를 위해 지정된 티에서 플레이하고, 카트·자전거 진입은 삼가세요.",
        "앞 팀과 안전거리를 유지하고, 음주 후 이용은 자제하세요.",
        "우천·잔디 관리일에는 운영이 제한될 수 있습니다.",
      ];
    case "hotspring":
      return [
        "고혈압·심장질환이 있다면 장시간 입욕을 피하세요.",
        "입욕 전후로 충분히 수분을 섭취해 탈수를 예방하세요.",
        "음주 후 온천 이용은 위험할 수 있으니 삼가세요.",
        "귀중품은 개인 보관함을 이용하세요.",
      ];
    case "swim":
      return [
        "자유수영 가능 시간과 강습 시간을 미리 확인하세요.",
        "수영모 착용이 필수인 곳이 많습니다.",
        "준비운동 후 입수하고, 어린이는 보호자와 동반하세요.",
        "물놀이 후 충분히 휴식하고 체온을 유지하세요.",
      ];
    default: // hiking
      return [
        "일몰 시각을 확인하고 여유 있게 하산 계획을 세우세요.",
        "등산화·방수 겉옷·여벌 옷을 준비하세요.",
        "충분한 물과 간식, 간단한 상비약을 챙기세요.",
        "산불 조심 기간과 입산 통제 구간을 사전에 확인하세요.",
      ];
  }
}

/** 코스/이용 팁 섹션 (제목 + 본문) */
export function tipSection(p: Place): { title: string; body: string } {
  const a = p.attributes;
  if (p.category === "parkgolf") {
    const h = a.holes ?? 0;
    let body: string;
    if (!h) body = "코스 규모와 난이도는 현장에서 확인하세요.";
    else if (h <= 9)
      body = `${h}홀 규모의 아담한 코스로, 처음 파크골프를 접하거나 가볍게 한 바퀴 돌기에 좋습니다. 라운드 시간이 짧아 부담이 적습니다.`;
    else if (h <= 27)
      body = `${h}홀 규모로 정규 라운드를 즐기기 좋은 코스입니다. 여유롭게 즐기려면 이른 오전 방문을 추천합니다.`;
    else
      body = `${h}홀 규모의 대형 구장으로 여러 코스를 갖추고 있어, 다양하게 즐길 수 있습니다.`;
    return { title: "코스 구성", body };
  }
  if (p.category === "hotspring")
    return {
      title: "온천 이용 팁",
      body:
        "온천은 하루 중 이른 시간대가 비교적 한산합니다. 입욕은 한 번에 오래 하기보다 나눠서 즐기는 것이 몸에 무리가 적습니다. 온천 후에는 미지근한 물을 마셔 수분을 보충하세요.",
    };
  if (p.category === "swim")
    return {
      title: "이용 팁",
      body:
        "자유수영은 시간대별로 혼잡도가 다릅니다. 평일 낮 시간대가 비교적 여유로우며, 강습·회원 전용 시간과 겹치지 않는지 미리 확인하면 헛걸음을 줄일 수 있습니다.",
    };
  return {
    title: "최적의 방문 시기",
    body:
      "봄·가을이 걷기에 가장 좋습니다. 여름철은 이른 아침, 겨울철은 결빙·적설에 유의하고 아이젠 등 미끄럼 방지 장비를 준비하세요.",
  };
}

/** 방문 전 준비물 체크리스트 */
export function checklist(p: Place): string[] {
  switch (p.category) {
    case "parkgolf":
      return [
        "편한 운동화와 활동성 있는 복장",
        "모자·선크림·물 (햇볕·수분 대비)",
        "파크골프 클럽과 공 (현장 대여 가능 여부 확인)",
        "소액의 현금 (요금·대여 대비)",
      ];
    case "hotspring":
      return [
        "개인 수건과 세면도구",
        "갈아입을 속옷·여벌 옷",
        "온천 후 마실 물",
        "이용요금용 현금·카드",
      ];
    case "swim":
      return [
        "수영복·수영모·물안경",
        "개인 수건과 세면도구",
        "락커용 소액 동전",
        "샤워용품",
      ];
    default: // hiking
      return [
        "등산화와 편한 등산 복장",
        "방수 겉옷·여벌 옷·장갑",
        "충분한 물과 간식",
        "지도·헤드랜턴·상비약",
      ];
  }
}

/** 마무리 문단 */
export function closing(p: Place): string {
  const label = CATEGORIES[p.category].label;
  const where = loc(p);
  return `${where}에서 ${label}을(를) 찾고 있다면 ${p.name}을(를) 참고해 보세요. 운영시간·요금·휴무는 사정에 따라 달라질 수 있으니, 방문 전 전화로 한 번 확인하면 헛걸음을 줄일 수 있습니다. 아래에서 같은 지역과 가까운 곳의 다른 나들이 스팟도 함께 둘러보세요.`;
}

/** FAQPage JSON-LD */
export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
