import { NextResponse } from "next/server";

import { fetchPlaceById } from "@/lib/places-server";

/** 단건 장소(본문 포함) — 지도 시트에서 선택 시 지연 로딩 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const place = await fetchPlaceById(id);
    if (!place) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(place, {
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
