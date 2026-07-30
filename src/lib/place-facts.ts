/**
 * 좌표·공개 수치에서 **계산되는** 페이지 고유 사실.
 *
 * place-seo.ts 의 문장 풀(같은 글을 id 로 섞어 쓰는 방식)과 목적이 다르다.
 * 여기 값은 전부 실제 데이터에서 나오므로 장소마다 내용 자체가 달라진다.
 * 계산할 수 없으면 문장을 만들지 않는다(빈 값 → null). 추정·과장 금지.
 */
import { carMinutes } from "@/lib/course";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  isCoursePairable,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import type { MetricRank, NearbyPlace, RadiusStats } from "@/lib/places-server";

/** 직선 거리 표기 — 1km 미만은 100m 단위 */
export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 10) * 100}m`;
  return `${km.toFixed(1)}km`;
}

/** 거리 → "직선 6.2km · 차로 약 9분" */
export function formatDistance(km: number): string {
  return `직선 ${formatKm(km)} · 차로 약 ${carMinutes(km)}분`;
}

/** 반경 안 카테고리별 개수 (많은 순, 0인 카테고리는 제외) */
export function radiusBreakdown(
  radius: RadiusStats,
): Array<{ category: PlaceCategory; label: string; count: number }> {
  return CATEGORY_ORDER.map((c) => ({
    category: c,
    label: CATEGORIES[c].label,
    count: radius.counts[c] ?? 0,
  }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * 반경 요약 문장 — "차로 30분 안에 N곳" + 구성.
 * 반경 안에 아무것도 없으면(외딴 곳) 그 사실 자체를 알려준다.
 */
export function radiusSummary(place: Place, radius: RadiusStats): string {
  const where = [place.region, place.city].filter(Boolean).join(" ");
  if (radius.total === 0) {
    return `${place.name} 반경 ${radius.km}km 안에는 나들로가 수집한 다른 나들이 스팟이 없습니다. ${
      where ? `${where} 일대에서는 ` : ""
    }이 곳 한 곳을 목적지로 두고 일정을 잡는 편이 좋습니다.`;
  }
  const parts = radiusBreakdown(radius)
    .map((x) => `${x.label} ${x.count}곳`)
    .join(" · ");
  return `${place.name}을(를) 중심으로 반경 ${radius.km}km(차로 30분 안팎) 안에 나들로가 정리한 나들이 스팟이 ${radius.total}곳 있습니다. ${parts}.`;
}

/** 카테고리별 가장 가까운 곳 — 거리·소요시간이 붙은 실제 목록 */
export function nearestLines(
  radius: RadiusStats,
): Array<{ label: string; place: Place; km: number; minutes: number }> {
  return radius.nearestByCategory.map((n) => ({
    label: CATEGORIES[n.place.category].label,
    place: n.place,
    km: n.km,
    minutes: carMinutes(n.km),
  }));
}

/** 카테고리 조합 → 하루 코스가 되는 짝 (실제로 반경 안에 있을 때만) */
const PAIRING: Partial<Record<PlaceCategory, Partial<Record<PlaceCategory, string>>>> =
  {
    parkgolf: {
      hotspring: "한 라운드 돌고 온천에서 몸을 풀면 하루가 알차게 채워집니다",
      swim: "라운드 뒤 수영장에서 가볍게 몸을 풀 수 있습니다",
      arboretum: "라운드 전후로 수목원을 걸으면 이동 부담 없이 하루가 됩니다",
    },
    hotspring: {
      parkgolf: "파크골프 한 라운드 뒤에 들르면 피로가 잘 풀립니다",
      hiking: "산행 뒤 온천으로 마무리하는 조합이 가장 무난합니다",
      arboretum: "수목원을 천천히 걷고 온천에서 마무리하기 좋습니다",
    },
    hiking: {
      hotspring: "하산 후 온천에서 다리를 풀면 다음 날이 편합니다",
      arboretum: "산행이 부담스러운 날에는 수목원 산책으로 바꿔도 좋습니다",
      parkgolf: "체력에 따라 산행 대신 파크골프로 대체할 수 있습니다",
    },
    swim: {
      hotspring: "수영 뒤 온천에서 몸을 데우면 마무리가 좋습니다",
      parkgolf: "오전 파크골프, 오후 수영으로 하루를 나눌 수 있습니다",
    },
    arboretum: {
      hotspring: "숲길을 걷고 온천에서 마무리하면 이동 부담이 적습니다",
      parkgolf: "산책과 파크골프를 하루에 묶기 좋은 거리입니다",
    },
  };

/**
 * 코스 제안 — 반경 안에 실제로 있는 짝 카테고리 한 곳만.
 * 짝이 없으면 null (억지로 만들지 않는다).
 */
export function coursePairing(
  place: Place,
  radius: RadiusStats,
): { partner: NearbyPlace; sentence: string } | null {
  const table = PAIRING[place.category];
  if (!table) return null;
  for (const n of radius.nearestByCategory) {
    if (!isCoursePairable(n.place)) continue;
    const tip = table[n.place.category];
    if (tip) {
      return {
        partner: n,
        sentence: `가장 가까운 ${CATEGORIES[n.place.category].label}은(는) ${n.place.name}으로 ${formatDistance(n.km)} 거리입니다. ${tip}.`,
      };
    }
  }
  return null;
}

/**
 * 희소성 — 반경 안에 같은 종류가 몇 곳인지.
 * "이 일대에서 유일한 온천"인지 "널린 수영장 중 하나"인지는 방문 판단에
 * 직접 영향을 주는데, 개별 시설 페이지에는 절대 나오지 않는 정보다.
 */
export function scarcityNote(place: Place, radius: RadiusStats): string {
  const others = radius.counts[place.category] ?? 0;
  const label = CATEGORIES[place.category].label;
  const total = others + 1; // 자기 자신 포함

  if (others === 0) {
    return `반경 ${radius.km}km 안에서 나들로가 확인한 ${label}은 ${place.name} 한 곳뿐입니다. 근처에 대체할 곳이 없으므로 휴무일과 운영 여부를 미리 확인하고 움직이는 편이 안전합니다.`;
  }
  if (others <= 2) {
    return `반경 ${radius.km}km 안의 ${label}은 이곳을 포함해 ${total}곳뿐입니다. 선택지가 많지 않아 헛걸음하면 대안을 찾기 번거로운 편입니다.`;
  }
  if (others >= 15) {
    return `반경 ${radius.km}km 안에 ${label}이 ${total}곳 몰려 있습니다. 이곳이 붐비거나 운영시간이 맞지 않으면 가까운 다른 곳으로 바꾸기 쉬운 지역입니다.`;
  }
  return `반경 ${radius.km}km 안의 ${label}은 이곳을 포함해 ${total}곳입니다.`;
}

/**
 * 온천 수온 해석 — 숫자만으로는 모르는 '가온 여부'를 알려준다.
 * 온천법상 지하수 온도 25℃ 이상이면 온천으로 분류되므로, 30℃ 아래 원천은
 * 데워서 쓰는 것이 일반적이다. 수온 값이 없으면 아무 말도 하지 않는다.
 */
export function tempNote(place: Place): string | null {
  const raw = place.attributes.temp;
  if (place.category !== "hotspring" || !raw || raw === "-") return null;
  const v = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(v) || v <= 0) return null;

  if (v < 30) {
    return `원천 수온 ${v}℃는 체온보다 낮습니다. 우리나라 온천법은 지하수 온도 25℃ 이상을 온천으로 보기 때문에, 이런 곳은 원천수를 데워서(가온) 욕탕에 공급하는 것이 일반적입니다. 탕 온도 자체는 다른 온천과 비슷합니다.`;
  }
  if (v < 40) {
    return `원천 수온 ${v}℃로 미지근한 편입니다. 탕에 따라 데워 쓰기도 하며, 오래 몸을 담그기에는 부담이 적은 온도대입니다.`;
  }
  if (v < 45) {
    return `원천 수온 ${v}℃로 별도 가온 없이 쓰기 좋은 온도대입니다. 입욕 온도로는 가장 무난한 구간입니다.`;
  }
  return `원천 수온 ${v}℃로 높은 편입니다. 원천 그대로는 뜨거워 물을 섞어 온도를 낮춰 공급하며, 고혈압·심장질환이 있다면 장시간 입욕은 피하는 편이 좋습니다.`;
}

/** 지역 내 순위 문장 — "경기 파크골프장 78곳 중 홀 수 기준 12번째" */
export function rankSentence(place: Place, rank: MetricRank): string {
  const label = CATEGORIES[place.category].label;
  const pct = Math.round((rank.position / rank.total) * 100);
  const tier =
    pct <= 10
      ? "지역에서 손꼽히는 수준입니다"
      : pct <= 33
        ? "지역 상위권에 듭니다"
        : pct >= 80
          ? "지역에서는 아담한 편입니다"
          : "지역 평균에 가깝습니다";
  return `${place.region} ${label} ${rank.total}곳 가운데 ${rank.metric} 기준 ${rank.position}번째입니다. ${rank.value}${rank.unit}로 ${place.region} 평균 ${rank.average}${rank.unit}과 비교하면 ${tier}.`;
}

/**
 * 이 페이지가 '계산된 고유 정보'를 실제로 갖는지.
 * 색인 판단(isIndexablePlace)과 별개로, 본문 렌더 여부를 정한다.
 */
export function hasComputedFacts(
  radius: RadiusStats | null,
  rank: MetricRank | null,
): boolean {
  return Boolean((radius && radius.total > 0) || rank);
}
