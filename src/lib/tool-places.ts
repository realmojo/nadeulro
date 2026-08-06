/**
 * 도구가 쓰는 장소 형태 — 서버 의존성 없는 순수 타입/변환.
 * (클라이언트 컴포넌트가 import 하므로 supabase 를 끌어오는 모듈과 분리한다)
 */
import type { Place, PlaceCategory } from "@/lib/places";

export type ToolPlace = {
  id: number;
  category: PlaceCategory;
  name: string;
  slug: string;
  region: string | null;
  city: string | null;
  lat: number;
  lng: number;
  /** 파크골프: 홀 수 */
  holes?: number;
  /** 등산: 해발(m) */
  height?: number;
};

/** /api/places 응답의 Place → ToolPlace. 좌표 없는 곳은 제외(거리·일몰 계산 불가) */
export function toToolPlaces(places: Place[]): ToolPlace[] {
  const out: ToolPlace[] = [];
  for (const p of places) {
    if (p.lat == null || p.lng == null) continue;
    const a = p.attributes ?? {};
    out.push({
      id: p.id,
      category: p.category,
      name: p.name,
      slug: p.slug,
      region: p.region,
      city: p.city,
      lat: p.lat,
      lng: p.lng,
      ...(a.holes ? { holes: a.holes } : {}),
      ...(a.height ? { height: a.height } : {}),
    });
  }
  return out;
}
