/**
 * 파크골프장 데이터 계층.
 * 출처: 공공데이터포털(data.go.kr) 파크골프장 현황 / 전국공공시설개방정보.
 * 초기 전략: 시·도별 CSV → 전국 통합 JSON (scripts/merge-parkgolf.ts) → 정적 로드.
 * 좌표 없는 데이터는 카카오 로컬 API로 지오코딩.
 */
import fs from "node:fs";
import path from "node:path";

export type ParkGolfCourse = {
  /** 통합 고유 id (예: "gyeonggi-0001") */
  id: string;
  name: string;
  /** 시·도 (예: "경기도") */
  region: string;
  /** 시·군·구 */
  city?: string;
  address: string;
  /** 홀 수 (9/18/27/36 등) */
  holes?: number;
  phone?: string;
  fee?: string;
  lat?: number;
  lng?: number;
};

const DATA_FILE = path.join(
  process.cwd(),
  "data",
  "parkgolf",
  "parkgolf.json"
);

/** 전국 통합 파크골프장 목록을 읽는다. 파일이 없으면 빈 배열. */
export function getAllParkGolfCourses(): ParkGolfCourse[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as ParkGolfCourse[];
  } catch {
    return [];
  }
}

/** 시·도 목록(중복 제거, 이름순). */
export function getRegions(): string[] {
  const regions = new Set(getAllParkGolfCourses().map((c) => c.region));
  return [...regions].sort((a, b) => a.localeCompare(b, "ko"));
}

/** id로 단건 조회. */
export function getCourseById(id: string): ParkGolfCourse | undefined {
  return getAllParkGolfCourses().find((c) => c.id === id);
}
