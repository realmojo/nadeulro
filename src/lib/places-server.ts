import { createClient } from "@supabase/supabase-js";

import { haversineKm } from "@/lib/geo";
import type { Place, PlaceCategory, PlacesPayload } from "@/lib/places";

const PAGE = 1000;

/** 상세(단건) select — 긴 본문 포함 */
const SELECT_COLS =
  "id,category,name,slug,region,city,address,lat,lng,phone,reserve_url,description,attributes";

/**
 * 목록(전체) select — description(산 소개 등 긴 본문) 제외.
 * 등산 1,338곳의 본문만 페이지당 수백 KB 를 차지해 지도 로딩을 늦춘다.
 */
const SELECT_COLS_LIST =
  "id,category,name,slug,region,city,address,lat,lng,phone,reserve_url,attributes";

/** 지도 화면이 실제로 쓰는 attributes 키 (나머지는 내부 메타 → 목록에서 제거) */
const LIST_ATTR_KEYS = [
  "holes",
  "manager",
  "temp",
  "composition",
  "status",
  "height",
  "subtitle",
  "top100_reason",
  "image",
] as const;

/** 대시보드 입력 실수 방어 — 양끝 공백·따옴표 제거 */
function cleanEnv(v: string | undefined): string {
  return (v ?? "").trim().replace(/^["']+|["']+$/g, "");
}

function makeClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !key) {
    throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)가 없습니다");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function rowToPlace(r: Row): Place {
  return {
    id: r.id,
    category: r.category,
    name: r.name,
    slug: r.slug,
    region: r.region,
    city: r.city,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    phone: r.phone,
    reserveUrl: r.reserve_url,
    description: r.description ?? null,
    attributes: r.attributes ?? {},
  };
}

/** 목록용 attributes 슬림화 — 화면에 쓰는 키만 남긴다 */
function slimAttributes(attrs: Place["attributes"] | null): Place["attributes"] {
  if (!attrs) return {};
  const out: Record<string, unknown> = {};
  for (const k of LIST_ATTR_KEYS) {
    const v = (attrs as Record<string, unknown>)[k];
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out as Place["attributes"];
}

/**
 * 카테고리 + 이름으로 단일 장소 조회 (상세 페이지 /[category]/[title] 용).
 * 동명 장소가 여러 개면 id 오름차순 첫 행을 반환한다.
 */
export async function fetchPlaceByName(
  category: PlaceCategory,
  name: string,
): Promise<Place | null> {
  const supabase = makeClient();
  const { data, error } = await supabase
    .from("nadeulro_places")
    .select(SELECT_COLS)
    .eq("category", category)
    .eq("name", name)
    .order("id", { ascending: true })
    .limit(1);

  if (error) throw new Error(`nadeulro_places 단건 조회 실패: ${error.message}`);
  const row = (data ?? [])[0] as Row | undefined;
  return row ? rowToPlace(row) : null;
}

/** 슬러그로 단건 조회 (상세 페이지 /[category]/[slug] 용) */
export async function fetchPlaceBySlug(
  category: PlaceCategory,
  slug: string,
): Promise<Place | null> {
  const supabase = makeClient();
  const { data, error } = await supabase
    .from("nadeulro_places")
    .select(SELECT_COLS)
    .eq("category", category)
    .eq("slug", slug)
    .limit(1);
  if (error) throw new Error(`nadeulro_places slug 조회 실패: ${error.message}`);
  const row = (data ?? [])[0] as Row | undefined;
  return row ? rowToPlace(row) : null;
}

/** id 로 단건 조회 (본문 description 포함) — 지도 시트 지연 로딩용 */
export async function fetchPlaceById(id: number): Promise<Place | null> {
  const supabase = makeClient();
  const { data, error } = await supabase
    .from("nadeulro_places")
    .select(SELECT_COLS)
    .eq("id", id)
    .limit(1);
  if (error) throw new Error(`nadeulro_places id 조회 실패: ${error.message}`);
  const row = (data ?? [])[0] as Row | undefined;
  return row ? rowToPlace(row) : null;
}

/** 거리(km)가 붙은 장소 — 상세 페이지의 고유 정보 계산에 쓰인다 */
export type NearbyPlace = { place: Place; km: number };

/** 반경 안에 무엇이 얼마나 있는지 — 좌표에서 계산되는 페이지 고유 사실 */
export type RadiusStats = {
  km: number;
  counts: Partial<Record<PlaceCategory, number>>;
  total: number;
  /** 카테고리별 가장 가까운 한 곳 (자기 카테고리 제외) */
  nearestByCategory: NearbyPlace[];
};

/** 같은 시도·카테고리 안에서 수치 속성의 순위 */
export type MetricRank = {
  /** "홀 수" · "수온" · "높이" */
  metric: string;
  unit: string;
  value: number;
  /** 1 = 가장 큼/높음 */
  position: number;
  total: number;
  average: number;
};

export type RelatedPlaces = {
  /** 같은 지역·같은 카테고리 */
  sameRegion: Place[];
  /** 좌표 기준 가까운 다른 카테고리(+같은 카테고리) */
  nearby: NearbyPlace[];
  /** 반경 통계 (좌표 없으면 null) */
  radius: RadiusStats | null;
  /** 지역 내 순위 (수치 속성 없는 카테고리는 null) */
  rank: MetricRank | null;
};

const haversine = haversineKm;

/** 나들이 반경 기준 — 차로 30분 안쪽에 해당 */
const RADIUS_KM = 20;

/**
 * 카테고리별 '순위를 매길 수 있는' 수치 속성.
 * 수영장·수목원은 비교 가능한 공개 수치가 없어 순위를 만들지 않는다(지어내지 않음).
 */
function metricOf(
  p: Place,
): { metric: string; unit: string; value: number } | null {
  const a = p.attributes;
  if (p.category === "parkgolf" && a.holes) {
    return { metric: "홀 수", unit: "홀", value: a.holes };
  }
  if (p.category === "hiking" && a.height) {
    return { metric: "높이", unit: "m", value: a.height };
  }
  if (p.category === "hotspring" && a.temp && a.temp !== "-") {
    const v = Number.parseFloat(a.temp.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(v) && v > 0) {
      return { metric: "수온", unit: "℃", value: v };
    }
  }
  return null;
}

/**
 * 상세 페이지용 컨텍스트: 같은 지역 목록 + 가까운 곳(거리 포함)
 * + 반경 통계 + 지역 내 순위.
 *
 * 반경/순위는 좌표·공개 수치에서 **계산**되는 값이라 페이지마다 값이 다르다.
 * (문장 템플릿이 아니라 이 페이지에만 있는 사실 → 색인 가치의 근거)
 */
export async function fetchRelated(place: Place): Promise<RelatedPlaces> {
  const supabase = makeClient();

  // 같은 지역·같은 카테고리 (자기 자신 제외, 최대 8)
  let sameRegion: Place[] = [];
  if (place.region) {
    const { data } = await supabase
      .from("nadeulro_places")
      .select(SELECT_COLS_LIST)
      .eq("category", place.category)
      .eq("region", place.region)
      .neq("id", place.id)
      .order("id", { ascending: true })
      .limit(9);
    sameRegion = ((data ?? []) as Row[]).map(rowToPlace).slice(0, 8);
  }

  // 좌표 바운딩박스 → 하버사인 정렬 (다른 카테고리 우선 노출)
  let nearby: NearbyPlace[] = [];
  let radius: RadiusStats | null = null;
  if (place.lat != null && place.lng != null) {
    // 위도 0.25° ≈ 28km, 경도 0.3° ≈ 27km(북위 36°) — 반경 20km 를 충분히 덮는다
    const dLat = 0.25;
    const dLng = 0.3;
    const { data } = await supabase
      .from("nadeulro_places")
      .select(SELECT_COLS_LIST)
      .neq("id", place.id)
      .gte("lat", place.lat - dLat)
      .lte("lat", place.lat + dLat)
      .gte("lng", place.lng - dLng)
      .lte("lng", place.lng + dLng)
      .limit(1000);
    const rows = ((data ?? []) as Row[])
      .map(rowToPlace)
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({
        place: p,
        km: haversine(place.lat!, place.lng!, p.lat!, p.lng!),
      }))
      .sort((a, b) => a.km - b.km);

    // 반경 안 통계 + 카테고리별 최근접 (자기 카테고리 제외)
    const inRadius = rows.filter((x) => x.km <= RADIUS_KM);
    const counts: Partial<Record<PlaceCategory, number>> = {};
    const nearestByCategory: NearbyPlace[] = [];
    const seenCat = new Set<PlaceCategory>();
    for (const x of inRadius) {
      const c = x.place.category;
      counts[c] = (counts[c] ?? 0) + 1;
      if (c !== place.category && !seenCat.has(c)) {
        seenCat.add(c);
        nearestByCategory.push(x);
      }
    }
    radius = {
      km: RADIUS_KM,
      counts,
      total: inRadius.length,
      nearestByCategory,
    };

    // 내부링크: 다른 카테고리 먼저 6곳, 부족하면 같은 카테고리로 채움
    const sameIds = new Set(sameRegion.map((s) => s.id));
    nearby = [
      ...rows.filter((x) => x.place.category !== place.category),
      ...rows.filter((x) => x.place.category === place.category),
    ]
      .filter((x) => !sameIds.has(x.place.id))
      .slice(0, 6);
  }

  // 같은 시도·카테고리 안에서의 수치 순위
  let rank: MetricRank | null = null;
  const self = metricOf(place);
  if (self && place.region) {
    const { data } = await supabase
      .from("nadeulro_places")
      .select("id,category,attributes")
      .eq("category", place.category)
      .eq("region", place.region)
      .limit(1500);
    const values = ((data ?? []) as Array<{
      id: number;
      category: PlaceCategory;
      attributes: Place["attributes"] | null;
    }>)
      .map((r) =>
        metricOf({
          ...place,
          id: r.id,
          attributes: r.attributes ?? {},
        })?.value,
      )
      .filter((v): v is number => typeof v === "number");

    if (values.length >= 3) {
      const higher = values.filter((v) => v > self.value).length;
      rank = {
        metric: self.metric,
        unit: self.unit,
        value: self.value,
        position: higher + 1,
        total: values.length,
        average:
          Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) /
          10,
      };
    }
  }

  return { sameRegion, nearby, radius, rank };
}

/** 지역별 랜딩용: 카테고리+지역의 전체 장소 (도시→이름 정렬) */
export async function fetchByCategoryRegion(
  category: PlaceCategory,
  region: string,
): Promise<Place[]> {
  const supabase = makeClient();
  const { data, error } = await supabase
    .from("nadeulro_places")
    .select(SELECT_COLS_LIST)
    .eq("category", category)
    .eq("region", region)
    .order("city", { ascending: true })
    .order("name", { ascending: true })
    .limit(1500);
  if (error) throw new Error(`지역 조회 실패: ${error.message}`);
  return ((data ?? []) as Row[]).map(rowToPlace);
}

/**
 * 사이트맵/색인 판정용 전체 목록 — isIndexablePlace() 가 본문 길이를 보므로
 * description 을 포함해 조회한다(하루 1회 ISR 이라 전송량 비용을 감수).
 * 본문은 판정 직후 길이만 남기고 버려 메모리에 쌓이지 않게 한다.
 */
export async function fetchSitemapPlaces(): Promise<Place[]> {
  const supabase = makeClient();
  const out: Place[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("nadeulro_places")
      .select(SELECT_COLS)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`사이트맵 조회 실패: ${error.message}`);
    const rows = (data ?? []) as Row[];
    out.push(...rows.map(rowToPlace));
    if (rows.length < PAGE) break;
  }
  return out;
}

/** 시군구 허브용: 한 시군구의 모든 카테고리 장소 */
export async function fetchCityPlaces(
  region: string,
  city: string,
): Promise<Place[]> {
  const supabase = makeClient();
  const { data, error } = await supabase
    .from("nadeulro_places")
    .select(SELECT_COLS_LIST)
    .eq("region", region)
    .eq("city", city)
    .order("category", { ascending: true })
    .order("name", { ascending: true })
    .limit(1500);
  if (error) throw new Error(`시군구 조회 실패: ${error.message}`);
  return ((data ?? []) as Row[]).map(rowToPlace);
}

/** 카테고리별 지역(시도) + 개수 — 지역 페이지 생성/색인용 */
export async function regionsForCategory(
  category: PlaceCategory,
): Promise<Array<{ region: string; count: number }>> {
  const supabase = makeClient();
  const m = new Map<string, number>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("nadeulro_places")
      .select("region")
      .eq("category", category)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`지역 집계 실패: ${error.message}`);
    for (const r of (data ?? []) as Array<{ region: string | null }>) {
      if (r.region) m.set(r.region, (m.get(r.region) ?? 0) + 1);
    }
    if (!data || data.length < PAGE) break;
  }
  return [...m.entries()].map(([region, count]) => ({ region, count }));
}

type Row = {
  id: number;
  category: PlaceCategory;
  name: string;
  slug: string;
  region: string | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  reserve_url: string | null;
  /** 목록 select 에는 포함되지 않음(undefined) */
  description?: string | null;
  attributes: Place["attributes"] | null;
};

/**
 * nadeulro_places 전체 로드 (게시 행만, RLS 통과) — 지도/목록용 슬림 페이로드.
 * - description(긴 본문)·내부 메타 attributes 제외
 * - 첫 페이지에서 전체 행수를 받아 나머지 페이지를 병렬 조회
 *   (순차 4왕복 → 1왕복 + 병렬, 서버 소요 3초대 → 1초 미만)
 */
export async function fetchPlaces(): Promise<PlacesPayload> {
  const supabase = makeClient();

  const query = (from: number) =>
    supabase
      .from("nadeulro_places")
      .select(SELECT_COLS_LIST, from === 0 ? { count: "exact" } : undefined)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

  /* 1) 첫 페이지 + 전체 행수 */
  const first = await query(0);
  if (first.error)
    throw new Error(`nadeulro_places 조회 실패: ${first.error.message}`);
  const total = first.count ?? first.data?.length ?? 0;

  /* 2) 나머지 페이지 병렬 조회 */
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, Math.ceil(total / PAGE) - 1) }, (_, i) =>
      query((i + 1) * PAGE)
    )
  );

  const places: Place[] = [];
  for (const res of [first, ...rest]) {
    if (res.error)
      throw new Error(`nadeulro_places 조회 실패: ${res.error.message}`);
    for (const r of (res.data ?? []) as Row[]) {
      const p = rowToPlace(r);
      p.description = null; // 목록에는 본문 미포함 (상세 페이지에서 단건 조회)
      p.attributes = slimAttributes(r.attributes);
      places.push(p);
    }
  }

  const counts: Record<PlaceCategory, number> = {
    parkgolf: 0,
    hotspring: 0,
    swim: 0,
    hiking: 0,
    arboretum: 0,
  };
  for (const p of places) counts[p.category] += 1;

  return { places, counts };
}
