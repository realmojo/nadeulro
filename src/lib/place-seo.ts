/**
 * 상세 페이지 AEO(FAQ) 문구 생성 — 순수 함수(fetch 없음). 사실만 사용.
 * 서버 컴포넌트에서 렌더해 초기 HTML + FAQPage JSON-LD 에 함께 넣는다.
 */
import { CATEGORIES, type Place } from "@/lib/places";

export type Faq = { q: string; a: string };

function loc(p: Place): string {
  return [p.region, p.city].filter(Boolean).join(" ");
}

/* ---- 결정적 변형(중복 콘텐츠 완화) ---------------------------------
 * 같은 카테고리라도 페이지마다 다른 문장 조합을 쓰도록 id 로 섞는다. */
function hash(n: number): number {
  let x = n | 0;
  x = (x ^ 61) ^ (x >>> 16);
  x = x + (x << 3);
  x = x ^ (x >>> 4);
  x = Math.imul(x, 0x27d4eb2d);
  x = x ^ (x >>> 15);
  return x >>> 0;
}
/** 풀에서 seed 기준으로 n개를 결정적으로 선택 */
function pickN<T>(pool: T[], n: number, seed: number): T[] {
  return pool
    .map((v, i) => ({ v, k: hash(seed * 1009 + i * 97) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, n)
    .map((x) => x.v);
}
/** 풀에서 seed 기준으로 1개 선택 */
function pickOne<T>(pool: T[], seed: number): T {
  return pool[hash(seed) % pool.length];
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
      a: `전화번호는 ${p.phone}입니다. ${pickOne(
        [
          "방문 전 운영시간과 이용 가능 여부를 확인해 보세요.",
          "예약·운영시간은 전화로 문의하는 것이 정확합니다.",
          "휴무일이나 이용 조건은 전화로 미리 확인하면 좋습니다.",
        ],
        p.id,
      )}`,
    });
  } else {
    const gov = p.city ? `${p.city}청` : "관할 지자체";
    faqs.push({
      q: `${p.name} 전화번호는 무엇인가요?`,
      a:
        p.category === "parkgolf"
          ? `공영 파크골프장은 무료 개방이거나 상주 관리 인력이 없어 별도 대표번호가 등록되지 않은 곳이 많습니다. ${p.name}도 공개 자료에 연락처가 없어 현재 번호를 안내하지 못합니다. 이용 문의는 ${gov} 문화체육 담당 부서나 지역 파크골프 동호회를 통해 확인하실 수 있습니다.`
          : `${p.name}의 대표 전화번호가 공개된 공공데이터에 포함되어 있지 않아 현재 안내하지 못합니다. 이용 문의는 ${gov} 담당 부서에 문의해 주세요.`,
    });
  }

  // 예약
  if (p.category === "parkgolf") {
    faqs.push({
      q: `${p.name}은(는) 예약이 필요한가요?`,
      a: p.reserveUrl
        ? pickOne(
            [
              "온라인 예약 페이지가 제공됩니다. 이용 전 예약 가능 시간과 운영 여부를 확인하세요.",
              "예약 페이지를 통해 미리 예약할 수 있습니다. 방문 전 잔여 시간을 확인해 두면 좋습니다.",
            ],
            p.id,
          )
        : pickOne(
            [
              "공영 파크골프장은 예약 없이 이용하는 경우가 많지만, 지역·시간대에 따라 다를 수 있어 방문 전 전화 확인을 권합니다.",
              "대개 예약 없이 선착순으로 이용하지만, 이용객이 몰리면 대기가 생길 수 있으니 전화로 미리 확인해 보세요.",
            ],
            p.id,
          ),
    });
  }

  // 길찾기 (항상)
  if (p.lat != null && p.lng != null) {
    const w = loc(p);
    faqs.push({
      q: `${p.name} 가는 길은 어떻게 찾나요?`,
      a: pickOne(
        [
          `이 페이지의 ‘카카오맵 길찾기’ 버튼을 누르면 현재 위치에서 ${w}까지 가는 길이 안내됩니다.`,
          `상단의 ‘카카오맵 길찾기’를 누르면 카카오맵으로 연결되어 ${p.name}까지의 경로를 확인할 수 있습니다.`,
          `‘카카오맵 길찾기’ 버튼으로 현재 위치에서 ${p.name}까지의 대중교통·자동차 경로를 볼 수 있습니다.`,
        ],
        p.id,
      ),
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

/** 이용/예약 안내 도입 문장 (장소 사실을 최대한 문장에 녹여 고유성 확보) */
export function usageIntro(p: Place): string {
  const a = p.attributes;
  const where = loc(p);
  const seed = p.id;
  if (p.category === "parkgolf") {
    const size = a.holes ? `${a.holes}홀 규모의 ` : "";
    const mgr = a.manager ? ` ${a.manager}에서 운영합니다.` : "";
    const rsv = p.reserveUrl
      ? pickOne(
          [
            " 온라인 예약 페이지가 제공되므로, 이용 전 예약 여부와 운영시간을 확인해 두면 좋습니다.",
            " 온라인 예약이 가능하니, 방문 전 예약 페이지에서 잔여 시간과 운영 여부를 확인해 보세요.",
          ],
          seed,
        )
      : pickOne(
          [
            " 공영 파크골프장은 별도 예약 없이 선착순으로 이용하는 경우가 많지만, 주말·오전에는 대기가 있을 수 있어 방문 전 전화 확인을 권합니다.",
            " 예약 없이 현장 이용이 일반적이나, 이용객이 몰리는 시간대에는 대기가 생길 수 있어 미리 전화로 확인하면 좋습니다.",
          ],
          seed,
        );
    const lead = pickOne(
      [
        `${p.name}은(는) ${where}에 있는 ${size}파크골프장입니다.`,
        `${where}에 자리한 ${size}파크골프장 ${p.name}입니다.`,
      ],
      seed,
    );
    return `${lead}${mgr}${rsv}`;
  }
  if (p.category === "hotspring") {
    const t =
      a.temp && a.temp !== "-"
        ? ` 온천수 수온은 ${a.temp}${a.composition && a.composition !== "-" ? `, 수질은 ${a.composition} 성분` : ""}입니다.`
        : "";
    const tail = pickOne(
      [
        " 목욕·온천 이용 시간과 요금은 시설마다 다르므로 방문 전 확인하세요.",
        " 이용 시간과 요금은 시설별로 다르니 방문 전 전화로 확인하는 것이 좋습니다.",
      ],
      seed,
    );
    return `${p.name}은(는) ${where}에 위치한 온천입니다.${t}${tail}`;
  }
  if (p.category === "swim") {
    return pickOne(
      [
        `${p.name}은(는) ${where}에 있는 수영장입니다. 실내·야외 여부와 자유수영 가능 시간, 강습 운영은 시설마다 다르니 방문 전 전화로 자유수영 시간을 확인하는 것이 좋습니다.`,
        `${where}에 위치한 수영장 ${p.name}입니다. 자유수영 시간과 강습·회원 전용 시간은 시설마다 달라, 방문 전 확인하면 헛걸음을 줄일 수 있습니다.`,
      ],
      seed,
    );
  }
  // hiking
  const h = a.height ? ` 해발 ${a.height.toLocaleString()}m의 산으로,` : "";
  return `${p.name}은(는) ${where}에 위치한 산입니다.${h} 아래 소개와 유의사항을 확인하고, 기상과 일몰 시각을 고려해 여유 있게 산행을 계획하세요.`;
}

/** 이용 시 주의사항 — 카테고리별 풀에서 id 기준 4개 선택 */
export function usageNotes(p: Place): string[] {
  const POOLS: Record<Place["category"], string[]> = {
    parkgolf: [
      "파크골프 전용 클럽·공을 준비하거나 현장 대여 여부를 확인하세요.",
      "잔디 보호를 위해 지정된 티에서 플레이하세요.",
      "카트·자전거의 코스 진입은 삼가세요.",
      "앞 팀과 안전거리를 유지하며 플레이하세요.",
      "음주 후 이용은 자제하고 안전에 유의하세요.",
      "우천이나 잔디 관리일에는 운영이 제한될 수 있습니다.",
      "이용객이 많은 시간대에는 순서를 지켜 차례로 이용하세요.",
    ],
    hotspring: [
      "고혈압·심장질환이 있다면 장시간 입욕을 피하세요.",
      "입욕 전후로 충분히 수분을 섭취해 탈수를 예방하세요.",
      "음주 후 온천 이용은 위험할 수 있으니 삼가세요.",
      "귀중품은 개인 보관함을 이용하세요.",
      "탕에 들어가기 전 몸을 씻어 위생을 지켜 주세요.",
      "어지럼증이 느껴지면 즉시 탕에서 나와 휴식하세요.",
      "장시간 입욕보다 여러 번 나눠 즐기는 편이 몸에 무리가 적습니다.",
    ],
    swim: [
      "자유수영 가능 시간과 강습 시간을 미리 확인하세요.",
      "수영모 착용이 필수인 곳이 많습니다.",
      "준비운동 후 천천히 입수하세요.",
      "어린이는 반드시 보호자와 동반하세요.",
      "물놀이 후 충분히 휴식하고 체온을 유지하세요.",
      "수심 표시와 안전요원 안내를 따르세요.",
      "샤워 후 입장하는 등 시설 위생 수칙을 지켜 주세요.",
    ],
    hiking: [
      "일몰 시각을 확인하고 여유 있게 하산 계획을 세우세요.",
      "등산화·방수 겉옷·여벌 옷을 준비하세요.",
      "충분한 물과 간식, 간단한 상비약을 챙기세요.",
      "산불 조심 기간과 입산 통제 구간을 사전에 확인하세요.",
      "기상 악화 시 무리한 산행을 피하세요.",
      "정해진 등산로를 벗어나지 마세요.",
      "휴대폰 배터리와 위치 공유를 미리 준비하세요.",
    ],
    arboretum: [
      "휴관일과 운영시간을 홈페이지·연락처로 미리 확인하세요.",
      "국공립은 무료·소액이 많지만 사립 정원은 입장료가 있을 수 있습니다.",
      "걷기 좋은 편한 신발과 계절에 맞는 옷차림을 준비하세요.",
      "여름철에는 모자·물·햇빛 차단, 벌레 기피제를 챙기면 좋습니다.",
      "지정된 산책로를 따라 걷고 식물·꽃을 훼손하지 마세요.",
      "반려동물 동반·취식 가능 여부는 시설 규정을 확인하세요.",
      "봄꽃·가을 단풍 등 계절 볼거리를 미리 확인하면 알차게 둘러볼 수 있습니다.",
    ],
  };
  return pickN(POOLS[p.category], 4, p.id);
}

/** 코스/이용 팁 섹션 (제목 + 본문) — 홀수·id 로 변형 */
export function tipSection(p: Place): { title: string; body: string } {
  const a = p.attributes;
  const seed = p.id;
  if (p.category === "parkgolf") {
    const h = a.holes ?? 0;
    let body: string;
    if (!h) body = "코스 규모와 난이도는 현장에서 확인하세요.";
    else if (h <= 9)
      body = pickOne(
        [
          `${h}홀 규모의 아담한 코스로, 처음 파크골프를 접하거나 가볍게 한 바퀴 돌기에 좋습니다. 라운드 시간이 짧아 부담이 적습니다.`,
          `${h}홀 코스라 짧은 시간에 즐기기 좋아, 입문자나 가벼운 나들이에 알맞습니다.`,
        ],
        seed,
      );
    else if (h <= 27)
      body = pickOne(
        [
          `${h}홀 규모로 정규 라운드를 즐기기 좋은 코스입니다. 여유롭게 즐기려면 이른 오전 방문을 추천합니다.`,
          `${h}홀을 갖춰 제대로 된 라운드가 가능합니다. 한산한 평일 오전 방문이 여유롭습니다.`,
        ],
        seed,
      );
    else
      body = `${h}홀 규모의 대형 구장으로 여러 코스를 갖추고 있어, 그날 컨디션에 맞춰 다양하게 즐길 수 있습니다.`;
    return { title: "코스 구성", body };
  }
  if (p.category === "hotspring")
    return {
      title: "온천 이용 팁",
      body: pickOne(
        [
          "온천은 하루 중 이른 시간대가 비교적 한산합니다. 입욕은 한 번에 오래 하기보다 나눠서 즐기는 것이 몸에 무리가 적습니다.",
          "이른 오전이나 늦은 저녁이 붐비지 않는 편입니다. 입욕과 휴식을 번갈아 하며 즐기면 피로가 덜합니다.",
        ],
        seed,
      ),
    };
  if (p.category === "swim")
    return {
      title: "이용 팁",
      body: pickOne(
        [
          "자유수영은 시간대별로 혼잡도가 다릅니다. 평일 낮 시간대가 비교적 여유로우며, 강습·회원 전용 시간과 겹치지 않는지 미리 확인하면 헛걸음을 줄일 수 있습니다.",
          "평일 이른 시간이나 낮 시간대가 붐비지 않는 편입니다. 강습 시간과 자유수영 시간이 나뉘어 있으니 방문 전 시간표를 확인하세요.",
        ],
        seed,
      ),
    };
  return {
    title: "최적의 방문 시기",
    body: pickOne(
      [
        "봄·가을이 걷기에 가장 좋습니다. 여름철은 이른 아침, 겨울철은 결빙·적설에 유의하고 아이젠 등 미끄럼 방지 장비를 준비하세요.",
        "선선한 봄·가을이 산행하기 좋습니다. 한여름은 이른 시간에 오르고, 겨울에는 결빙 구간에 대비하세요.",
      ],
      seed,
    ),
  };
}

/** 방문 전 준비물 — 풀에서 id 기준 4개 선택 */
export function checklist(p: Place): string[] {
  const POOLS: Record<Place["category"], string[]> = {
    parkgolf: [
      "편한 운동화와 활동성 있는 복장",
      "모자·선크림 (햇볕 대비)",
      "충분한 물과 간단한 간식",
      "파크골프 클럽과 공 (대여 가능 여부 확인)",
      "소액의 현금 (요금·대여 대비)",
      "얇은 겉옷 (아침·저녁 기온차 대비)",
    ],
    hotspring: [
      "개인 수건과 세면도구",
      "갈아입을 속옷·여벌 옷",
      "온천 후 마실 물",
      "이용요금용 현금·카드",
      "머리끈·샤워캡 등 개인용품",
      "귀중품 보관용 잔돈",
    ],
    swim: [
      "수영복·수영모·물안경",
      "개인 수건과 세면도구",
      "락커용 소액 동전",
      "샤워용품",
      "방수 파우치나 비닐백",
      "어린이 동반 시 구명 조끼·튜브",
    ],
    hiking: [
      "등산화와 편한 등산 복장",
      "방수 겉옷·여벌 옷·장갑",
      "충분한 물과 행동식",
      "지도·나침반 또는 지도 앱",
      "헤드랜턴과 여분 배터리",
      "간단한 구급약과 파스",
    ],
    arboretum: [
      "걷기 편한 신발과 활동성 있는 복장",
      "모자·선크림 (햇볕 대비)",
      "충분한 물과 간단한 간식",
      "얇은 겉옷 (아침·저녁 기온차 대비)",
      "카메라 (꽃·단풍 기록용)",
      "입장료·주차용 소액 현금",
    ],
  };
  return pickN(POOLS[p.category], 4, p.id);
}

/** 마무리 문단 — 사실을 녹인 템플릿을 id 로 선택 */
export function closing(p: Place): string {
  const label = CATEGORIES[p.category].label;
  const where = loc(p);
  const a = p.attributes;
  const spec =
    p.category === "parkgolf" && a.holes
      ? `${a.holes}홀 `
      : p.category === "hotspring" && a.temp && a.temp !== "-"
        ? `수온 ${a.temp}의 `
        : p.category === "hiking" && a.height
          ? `해발 ${a.height.toLocaleString()}m `
          : "";
  const templates = [
    `${where}에서 ${label}을(를) 찾고 있다면 ${spec}${p.name}을(를) 참고해 보세요. 운영 정보는 사정에 따라 달라질 수 있으니, 방문 전 전화로 확인하면 헛걸음을 줄일 수 있습니다.`,
    `${p.name}은(는) ${where}의 ${spec}${label}입니다. 실제 운영시간·요금은 바뀔 수 있어 방문 전 한 번 확인하는 것을 권합니다.`,
    `가까운 ${label}을(를) 찾는다면 ${where}의 ${spec}${p.name}이(가) 좋은 선택이 될 수 있습니다. 방문 전 운영 여부만 확인하면 안심입니다.`,
  ];
  const tail = pickOne(
    [
      "아래에서 같은 지역과 가까운 곳의 다른 나들이 스팟도 함께 둘러보세요.",
      "이어서 같은 지역의 다른 곳과 근처 나들이 스팟도 확인해 보세요.",
      "아래 목록에서 인근의 다른 나들이 장소도 함께 살펴보시길 권합니다.",
    ],
    p.id + 7,
  );
  return `${pickOne(templates, p.id)} ${tail}`;
}

/** 하단 면책 문구 — 3종 변형 */
/**
 * 연락처(전화)가 없는 곳에 대한 설명 콘텐츠 — 없는 이유 + 확인 방법.
 * 사실에 기반: 대부분 지자체 운영 공영 구장이라 대표번호 미등록.
 */
export function contactNote(p: Place): { reason: string; guides: string[] } {
  const gov = p.city
    ? `${p.city}청`
    : p.region
      ? `${p.region} 관할 시·군·구청`
      : "관할 지자체";
  let reason: string;
  if (p.category === "parkgolf") {
    reason = `${p.name}은(는) 지방자치단체가 조성·운영하는 공영 구장으로 보입니다. 무료로 개방되거나 상주 관리 인력이 없어 별도 대표 전화번호가 등록되지 않은 곳이 많고, 공개된 공공데이터에도 연락처가 포함되어 있지 않아 현재 번호를 확인하지 못했습니다.`;
  } else if (p.category === "swim") {
    reason = `${p.name}은(는) 공공 체육시설로, 대표번호가 시설관리공단이나 지자체로 통합되어 개별 번호가 공개 자료에 등록되지 않았을 수 있습니다.`;
  } else if (p.category === "hotspring") {
    reason = `${p.name}의 대표 전화번호가 공개된 공공데이터에 포함되어 있지 않아 현재 확인하지 못했습니다. 운영 형태(공영·민간)에 따라 대표번호가 없거나 변경되었을 수 있습니다.`;
  } else {
    reason = `${p.name}의 대표 전화번호가 공개된 공공데이터에 포함되어 있지 않아 현재 확인하지 못했습니다.`;
  }
  const guides = [
    `${gov} 문화체육(체육진흥) 담당 부서에 문의하면 이용 방법과 개방 시간을 안내받을 수 있습니다.`,
    `아래 카카오맵 길찾기로 현장을 방문해 안내판이나 관리사무소에서 확인하는 방법도 있습니다.`,
  ];
  if (p.category === "parkgolf")
    guides.push(
      `지역 파크골프 동호회나 대한파크골프협회 지부를 통해서도 이용 정보를 얻을 수 있습니다.`,
    );
  return { reason, guides };
}

export function disclaimer(p: Place): string {
  return pickOne(
    [
      "본 정보는 각 지방자치단체·공공기관의 공개 자료를 바탕으로 정리한 나들이 참고용 자료입니다. 실제 운영시간·요금·휴무와 다를 수 있으니 방문 전 해당 시설에 확인해 주세요.",
      "여기 정리한 정보는 공공기관 공개 자료 기반의 참고용입니다. 운영시간·요금·휴무일은 변동될 수 있으므로, 방문 전 시설에 직접 확인하시길 권합니다.",
      "위 내용은 공개 데이터를 정리한 나들이 참고 자료로, 실제와 차이가 있을 수 있습니다. 방문 전 운영 여부를 확인하면 헛걸음을 줄일 수 있습니다.",
    ],
    p.id,
  );
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
