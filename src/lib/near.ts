/**
 * 시군구 나들이 허브 — 한 동네의 카테고리를 가로질러 묶는다.
 *
 * 개별 시설 나열은 지도 앱에도 있지만, "이 동네에서 무엇과 무엇을 하루에 묶을 수
 * 있는가"는 좌표를 다 가진 쪽만 계산할 수 있다. 이 파일은 그 계산을 담당한다.
 * 전부 실제 데이터에서 나오므로 동네마다 결과가 다르다.
 */
import { carMinutes } from "@/lib/course";
import { haversineKm } from "@/lib/geo";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  isCoursePairable,
  type Place,
  type PlaceCategory,
} from "@/lib/places";

/** 허브 페이지 경로 (예: /near/경기/고양시) */
export function nearPath(region: string, city: string): string {
  return `/near/${encodeURIComponent(region)}/${encodeURIComponent(city)}`;
}

/** 하루에 묶을 만한 거리 — 이 안의 조합만 코스로 제안한다 */
export const PAIR_MAX_KM = 25;

export type CityPair = {
  a: Place;
  b: Place;
  km: number;
  minutes: number;
};

export type CitySummary = {
  region: string;
  city: string;
  /** 카테고리별 개수 (0 제외) */
  counts: Array<{ category: PlaceCategory; label: string; count: number }>;
  total: number;
  /** 보유 카테고리 수 — 2 이상이어야 '코스'가 성립한다 */
  categoryCount: number;
};

/** 장소 목록 → 시군구 요약 */
export function summarize(
  region: string,
  city: string,
  places: Place[],
): CitySummary {
  const map = new Map<PlaceCategory, number>();
  for (const p of places) map.set(p.category, (map.get(p.category) ?? 0) + 1);
  const counts = CATEGORY_ORDER.filter((c) => (map.get(c) ?? 0) > 0).map((c) => ({
    category: c,
    label: CATEGORIES[c].label,
    count: map.get(c) ?? 0,
  }));
  return {
    region,
    city,
    counts,
    total: places.length,
    categoryCount: counts.length,
  };
}

/**
 * 서로 다른 카테고리 조합 중 가장 가까운 짝들.
 * 카테고리 쌍마다 최단 거리 1개씩만 남긴다(같은 쌍 반복 방지).
 */
export function bestPairs(places: Place[], limit = 4): CityPair[] {
  const pts = places.filter(
    (p) => p.lat != null && p.lng != null && isCoursePairable(p),
  );
  const best = new Map<string, CityPair>();

  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i];
      const b = pts[j];
      if (a.category === b.category) continue;
      const km = haversineKm(a.lat!, a.lng!, b.lat!, b.lng!);
      if (km > PAIR_MAX_KM) continue;
      const key = [a.category, b.category].sort().join("|");
      const cur = best.get(key);
      if (!cur || km < cur.km) {
        best.set(key, { a, b, km, minutes: carMinutes(km) });
      }
    }
  }

  return [...best.values()].sort((x, y) => x.km - y.km).slice(0, limit);
}

/** 조합 한 줄 설명 — 카테고리 쌍에 따라 무엇을 먼저 할지 */
export function pairSentence(pair: CityPair): string {
  const order: PlaceCategory[] = [
    "hiking",
    "parkgolf",
    "arboretum",
    "swim",
    "hotspring",
  ];
  // 온천은 마무리, 등산·파크골프는 앞 — 체력 소모 순으로 정렬
  const [first, second] =
    order.indexOf(pair.a.category) <= order.indexOf(pair.b.category)
      ? [pair.a, pair.b]
      : [pair.b, pair.a];
  return `${first.name}(${CATEGORIES[first.category].short}) → ${second.name}(${CATEGORIES[second.category].short}) · 직선 ${pair.km.toFixed(1)}km, 차로 약 ${pair.minutes}분`;
}

/**
 * 허브 페이지 리드 문단 — 개수·조합 수가 그대로 문장이 된다.
 * (동네마다 숫자가 달라 문장도 달라진다)
 */
export function cityLead(summary: CitySummary, pairs: CityPair[]): string {
  const where = `${summary.region} ${summary.city}`;
  const parts = summary.counts.map((c) => `${c.label} ${c.count}곳`).join(" · ");
  if (summary.categoryCount < 2) {
    return `${where}에는 나들로가 정리한 나들이 스팟이 ${summary.total}곳 있습니다. ${parts}.`;
  }
  const pairLine = pairs.length
    ? ` 이 가운데 차로 ${pairs[0].minutes}분 거리에 있는 ${CATEGORIES[pairs[0].a.category].label}–${CATEGORIES[pairs[0].b.category].label} 조합처럼, 하루에 묶어 다녀올 수 있는 짝이 ${pairs.length}가지 있습니다.`
    : "";
  return `${where}에는 나들로가 정리한 나들이 스팟이 ${summary.total}곳 있습니다. ${parts}.${pairLine}`;
}
