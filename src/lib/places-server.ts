import { createClient } from "@supabase/supabase-js";

import type { Place, PlaceCategory, PlacesPayload } from "@/lib/places";

const PAGE = 1000;

/** select 컬럼 목록 (fetchPlaces / fetchPlaceByName 공용) */
const SELECT_COLS =
  "id,category,name,region,city,address,lat,lng,phone,reserve_url,description,attributes";

function makeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
    description: r.description,
    attributes: r.attributes ?? {},
  };
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
  description: string | null;
  attributes: Place["attributes"] | null;
};

/**
 * nadeulro_places 전체 로드 (게시 행만, RLS 통과).
 * Supabase 1,000행 페이지 제한을 range 로 우회한다.
 */
export async function fetchPlaces(): Promise<PlacesPayload> {
  const supabase = makeClient();

  const places: Place[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("nadeulro_places")
      .select(SELECT_COLS)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`nadeulro_places 조회 실패: ${error.message}`);

    for (const r of (data ?? []) as Row[]) places.push(rowToPlace(r));
    if (!data || data.length < PAGE) break;
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
