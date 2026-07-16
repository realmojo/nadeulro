import { createClient } from "@supabase/supabase-js";

import type { Place, PlaceCategory, PlacesPayload } from "@/lib/places";

const PAGE = 1000;

/** 상세(단건) select — 긴 본문 포함 */
const SELECT_COLS =
  "id,category,name,region,city,address,lat,lng,phone,reserve_url,description,attributes";

/**
 * 목록(전체) select — description(산 소개 등 긴 본문) 제외.
 * 등산 1,338곳의 본문만 페이지당 수백 KB 를 차지해 지도 로딩을 늦춘다.
 */
const SELECT_COLS_LIST =
  "id,category,name,region,city,address,lat,lng,phone,reserve_url,attributes";

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

export type RelatedPlaces = {
  /** 같은 지역·같은 카테고리 */
  sameRegion: Place[];
  /** 좌표 기준 가까운 다른 카테고리(+같은 카테고리) */
  nearby: Place[];
};

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 상세 페이지 내부링크용: 같은 지역 + 가까운 곳(좌표) */
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
  let nearby: Place[] = [];
  if (place.lat != null && place.lng != null) {
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
      .limit(400);
    const rows = ((data ?? []) as Row[])
      .map(rowToPlace)
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({
        p,
        d: haversine(place.lat!, place.lng!, p.lat!, p.lng!),
      }))
      .sort((a, b) => a.d - b.d);
    // 다른 카테고리 먼저 6곳, 부족하면 같은 카테고리로 채움
    const other = rows.filter((x) => x.p.category !== place.category);
    const sameIds = new Set(sameRegion.map((s) => s.id));
    nearby = [...other, ...rows.filter((x) => x.p.category === place.category)]
      .map((x) => x.p)
      .filter((p) => !sameIds.has(p.id))
      .slice(0, 6);
  }

  return { sameRegion, nearby };
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
  };
  for (const p of places) counts[p.category] += 1;

  return { places, counts };
}
