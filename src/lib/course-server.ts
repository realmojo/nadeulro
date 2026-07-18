import { createClient } from "@supabase/supabase-js";

import type { Course, CourseStop } from "@/lib/course";

function makeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수가 없습니다");
  return createClient(url, key, { auth: { persistSession: false } });
}

type Row = {
  id: number;
  slug: string;
  title: string;
  region: string | null;
  city: string | null;
  summary: string | null;
  anchor_id: number | null;
  stops: CourseStop[] | null;
  total_km: number | string | null;
  lat: number | null;
  lng: number | null;
  updated_at: string | null;
};

const COLS =
  "id,slug,title,region,city,summary,anchor_id,stops,total_km,lat,lng,updated_at";

function toCourse(r: Row): Course {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    region: r.region,
    city: r.city,
    summary: r.summary,
    anchorId: r.anchor_id,
    stops: Array.isArray(r.stops) ? r.stops : [],
    totalKm: r.total_km != null ? Number(r.total_km) : null,
    lat: r.lat,
    lng: r.lng,
    updatedAt: r.updated_at,
  };
}

/** 전체 코스 목록 (지역·거리 순) */
export async function fetchCourses(): Promise<Course[]> {
  const supabase = makeClient();
  const { data, error } = await supabase
    .from("nadeulro_courses")
    .select(COLS)
    .eq("is_published", true)
    .order("region", { ascending: true })
    .order("total_km", { ascending: true });
  if (error) throw new Error(`코스 목록 조회 실패: ${error.message}`);
  return ((data ?? []) as Row[]).map(toCourse);
}

/** slug 단건 */
export async function fetchCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = makeClient();
  const { data, error } = await supabase
    .from("nadeulro_courses")
    .select(COLS)
    .eq("is_published", true)
    .eq("slug", slug)
    .limit(1);
  if (error) throw new Error(`코스 단건 조회 실패: ${error.message}`);
  const row = (data ?? [])[0] as Row | undefined;
  return row ? toCourse(row) : null;
}

/** 같은 지역의 다른 코스 (관련 코스) */
export async function fetchCoursesByRegion(
  region: string,
  excludeSlug: string,
  limit = 4,
): Promise<Course[]> {
  const supabase = makeClient();
  const { data, error } = await supabase
    .from("nadeulro_courses")
    .select(COLS)
    .eq("is_published", true)
    .eq("region", region)
    .neq("slug", excludeSlug)
    .order("total_km", { ascending: true })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as Row[]).map(toCourse);
}
