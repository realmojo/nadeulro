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
