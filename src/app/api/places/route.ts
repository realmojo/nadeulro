import { NextResponse } from "next/server";

import { fetchPlaces } from "@/lib/places-server";

/** 장소 데이터는 자주 변하지 않는다 — 1시간 캐시 */
export const revalidate = 3600;

export async function GET() {
  try {
    const payload = await fetchPlaces();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
