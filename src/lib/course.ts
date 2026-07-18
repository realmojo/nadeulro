/**
 * 코스(나들이 코스) 공용 타입·경로 헬퍼.
 * 코스 = 온천을 축으로 가까운 파크골프/등산을 하루 동선으로 묶은 나들로만의 콘텐츠.
 */
import type { PlaceCategory } from "@/lib/places";

export type CourseStop = {
  id: number;
  category: PlaceCategory;
  name: string;
  slug: string;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  role: string;
  distanceToNextKm: number | null;
};

export type Course = {
  id: number;
  slug: string;
  title: string;
  region: string | null;
  city: string | null;
  summary: string | null;
  anchorId: number | null;
  stops: CourseStop[];
  totalKm: number | null;
  lat: number | null;
  lng: number | null;
  updatedAt: string | null;
};

/** /course/{slug} */
export function coursePath(slug: string): string {
  return `/course/${encodeURIComponent(slug)}`;
}

/** 직선거리(km) → 대략 차로 이동 시간(분). 직선 40km/h 환산, 최소 5분. */
export function carMinutes(km: number | null | undefined): number {
  if (!km || km <= 0) return 5;
  return Math.max(5, Math.round((km / 40) * 60));
}
