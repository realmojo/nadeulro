"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Crosshair, LoaderCircle, MapPin, Navigation } from "lucide-react";

import {
  PlacesLoadNote,
  useToolPlaces,
} from "@/components/tools/use-tool-places";
import { Button } from "@/components/ui/button";
import { carMinutes } from "@/lib/course";
import { haversineKm } from "@/lib/geo";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  REGION_ORDER,
  placeDetailPath,
  type PlaceCategory,
} from "@/lib/places";

const RADIUS_OPTIONS = [5, 10, 20, 30, 50];
const MAX_RESULTS = 40;

type Origin = { lat: number; lng: number; label: string };
type GeoState = "idle" | "locating" | "denied" | "unsupported";

export function NearbyFinder() {
  const { places, state } = useToolPlaces("all");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [geo, setGeo] = useState<GeoState>("idle");
  const [radiusKm, setRadiusKm] = useState(20);
  const [cats, setCats] = useState<Set<PlaceCategory>>(
    () => new Set(CATEGORY_ORDER),
  );

  /** 위치 권한을 거부해도 쓸 수 있도록, 지역 중심 좌표를 대안으로 둔다 */
  const regionCenters = useMemo(() => {
    const acc = new Map<string, { lat: number; lng: number; n: number }>();
    for (const p of places) {
      if (!p.region) continue;
      const cur = acc.get(p.region) ?? { lat: 0, lng: 0, n: 0 };
      cur.lat += p.lat;
      cur.lng += p.lng;
      cur.n += 1;
      acc.set(p.region, cur);
    }
    return REGION_ORDER.filter((r) => acc.has(r)).map((r) => {
      const v = acc.get(r)!;
      return { region: r, lat: v.lat / v.n, lng: v.lng / v.n };
    });
  }, [places]);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setGeo("unsupported");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "현재 위치",
        });
        setGeo("idle");
      },
      () => setGeo("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const results = useMemo(() => {
    if (!origin) return [];
    return places
      .filter((p) => cats.has(p.category))
      .map((p) => ({
        place: p,
        km: haversineKm(origin.lat, origin.lng, p.lat, p.lng),
      }))
      .filter((x) => x.km <= radiusKm)
      .sort((a, b) => a.km - b.km)
      .slice(0, MAX_RESULTS);
  }, [origin, places, cats, radiusKm]);

  const counts = useMemo(() => {
    const m = new Map<PlaceCategory, number>();
    for (const r of results) {
      m.set(r.place.category, (m.get(r.place.category) ?? 0) + 1);
    }
    return m;
  }, [results]);

  const toggleCat = (c: PlaceCategory) => {
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) {
        if (next.size > 1) next.delete(c);
      } else {
        next.add(c);
      }
      return next;
    });
  };

  return (
    <div className="mt-6">
      {/* 기준 위치 */}
      <section className="rounded-xl border border-border/70 bg-card p-4">
        <span className="block text-base font-semibold text-foreground/90">
          어디를 기준으로 찾을까요
        </span>

        <Button
          type="button"
          onClick={locate}
          disabled={geo === "locating"}
          className="mt-3 w-full sm:w-auto"
          size="lg"
        >
          {geo === "locating" ? <LoaderCircle className="animate-spin" /> : <Crosshair />}
          {geo === "locating" ? "위치를 확인하는 중…" : "현재 위치로 찾기"}
        </Button>

        {geo === "denied" ? (
          <p role="alert" className="mt-3 rounded-lg bg-muted/60 px-4 py-3 text-base text-foreground/85">
            위치 권한이 없어 현재 위치를 쓸 수 없습니다. 아래에서 지역을 골라
            주세요.
          </p>
        ) : null}
        {geo === "unsupported" ? (
          <p role="alert" className="mt-3 rounded-lg bg-muted/60 px-4 py-3 text-base text-foreground/85">
            이 브라우저는 위치 기능을 지원하지 않습니다. 아래에서 지역을 골라
            주세요.
          </p>
        ) : null}

        <div className="mt-4">
          <span className="block text-base font-semibold text-foreground/90">
            또는 지역으로 찾기
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {regionCenters.map((r) => {
              const active = origin?.label === r.region;
              return (
                <button
                  key={r.region}
                  type="button"
                  onClick={() =>
                    setOrigin({ lat: r.lat, lng: r.lng, label: r.region })
                  }
                  aria-pressed={active}
                  className={`min-h-11 rounded-lg border px-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  {r.region}
                </button>
              );
            })}
          </div>
        </div>
        <PlacesLoadNote state={state} />
      </section>

      {/* 조건 */}
      <section className="mt-4 rounded-xl border border-border/70 bg-card p-4">
        <span className="block text-base font-semibold text-foreground/90">
          반경
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadiusKm(r)}
              aria-pressed={radiusKm === r}
              className={`min-h-11 rounded-lg border px-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                radiusKm === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              {r}km
            </button>
          ))}
        </div>

        <span className="mt-4 block text-base font-semibold text-foreground/90">
          종류
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((c) => {
            const on = cats.has(c);
            const meta = CATEGORIES[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCat(c)}
                aria-pressed={on}
                className={`flex min-h-11 items-center gap-2 rounded-lg border px-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  on
                    ? "border-primary bg-accent/60"
                    : "border-input bg-background opacity-60 hover:opacity-100"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.short}
                {origin && on && counts.get(c) ? (
                  <span className="tabular-nums text-muted-foreground">
                    {counts.get(c)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* 결과 */}
      {!origin ? (
        <p className="mt-4 rounded-xl bg-muted/60 p-4 text-base leading-relaxed text-muted-foreground">
          위치를 정하면 반경 안의 나들이 스팟을 가까운 순서로 보여드립니다.
          각각까지의 직선 거리와 차로 걸리는 대략의 시간을 함께 계산합니다.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/60 p-4 text-base leading-relaxed text-foreground/85">
          {origin.label} 기준 반경 {radiusKm}km 안에는 고른 종류의 나들이 스팟이
          없습니다. 반경을 넓히거나 종류를 더 켜 보세요.
        </p>
      ) : (
        <section className="mt-6">
          <h2 className="font-display text-xl font-bold md:text-2xl">
            {origin.label} 기준 {radiusKm}km 안 · {results.length}곳
            {results.length === MAX_RESULTS ? " (가까운 순 40곳)" : ""}
          </h2>
          <ul className="mt-3 grid gap-2">
            {results.map(({ place: p, km }) => {
              const meta = CATEGORIES[p.category];
              return (
                <li key={p.id}>
                  <Link
                    href={placeDetailPath(p.category, p.slug)}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {p.name}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {meta.label} ·{" "}
                        {[p.region, p.city].filter(Boolean).join(" ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-bold tabular-nums">
                        {km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Navigation className="size-3.5" />약 {carMinutes(km)}분
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="mt-6 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
        <MapPin className="mr-1 inline size-4 align-text-bottom" />
        위치 정보는 이 브라우저 안에서만 거리 계산에 쓰이고 서버로 전송되거나
        저장되지 않습니다. 거리는 직선거리이며 실제 도로 거리는 이보다 깁니다.
        지역으로 찾을 때는 그 시도에 있는 스팟들의 평균 좌표를 기준으로 합니다.
      </p>
    </div>
  );
}
