"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Link2,
  Navigation,
  Route,
  Trash2,
  Wand2,
} from "lucide-react";

import { PlacePicker } from "@/components/tools/place-picker";
import {
  PlacesLoadNote,
  useToolPlaces,
} from "@/components/tools/use-tool-places";
import { Button } from "@/components/ui/button";
import { carMinutes } from "@/lib/course";
import { haversineKm } from "@/lib/geo";
import { CATEGORIES, placeDetailPath } from "@/lib/places";
import type { ToolPlace } from "@/lib/tool-places";

const MAX_STOPS = 6;
const PARAM = "stops";

/** 공유 주소용 식별자 — 슬러그가 카테고리마다 겹칠 수 있어 함께 담는다 */
const encodeStop = (p: ToolPlace) => `${p.category}~${p.slug}`;

export function CourseMaker() {
  const { places, state } = useToolPlaces("all");
  const [stops, setStops] = useState<ToolPlace[]>([]);
  const [copied, setCopied] = useState(false);

  const byKey = useMemo(() => {
    const m = new Map<string, ToolPlace>();
    for (const p of places) m.set(encodeStop(p), p);
    return m;
  }, [places]);

  // 공유 링크로 들어온 경우 주소에서 코스를 복원 (페이지는 정적으로 유지)
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(PARAM);
    if (!raw) return;
    const restored = raw
      .split(",")
      .map((k) => byKey.get(decodeURIComponent(k)))
      .filter((p): p is ToolPlace => Boolean(p))
      .slice(0, MAX_STOPS);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 상태(주소창 쿼리) 복원. 렌더 중에 읽으면 하이드레이션이 어긋난다.
    if (restored.length) setStops(restored);
  }, [byKey]);

  const legs = useMemo(
    () =>
      stops.slice(1).map((p, i) => {
        const prev = stops[i];
        const km = haversineKm(prev.lat, prev.lng, p.lat, p.lng);
        return { km, minutes: carMinutes(km) };
      }),
    [stops],
  );
  const totalKm = legs.reduce((s, l) => s + l.km, 0);
  const totalMin = legs.reduce((s, l) => s + l.minutes, 0);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= stops.length) return;
    setStops((s) => {
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  /** 첫 곳에서 시작해 가장 가까운 곳을 차례로 잇는다(최근접 이웃) */
  const optimize = useCallback(() => {
    setStops((s) => {
      if (s.length < 3) return s;
      const rest = [...s.slice(1)];
      const out = [s[0]];
      while (rest.length) {
        const last = out[out.length - 1];
        let bi = 0;
        let bd = Infinity;
        rest.forEach((p, i) => {
          const d = haversineKm(last.lat, last.lng, p.lat, p.lng);
          if (d < bd) {
            bd = d;
            bi = i;
          }
        });
        out.push(rest.splice(bi, 1)[0]);
      }
      return out;
    });
  }, []);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !stops.length) return "";
    const q = stops.map((p) => encodeURIComponent(encodeStop(p))).join(",");
    return `${window.location.origin}${window.location.pathname}?${PARAM}=${q}`;
  }, [stops]);

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      window.history.replaceState(null, "", shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 클립보드를 못 쓰면 아래 주소를 직접 복사하면 된다 */
    }
  };

  return (
    <div className="mt-6">
      <section className="rounded-xl border border-border/70 bg-card p-4">
        <PlacePicker
          places={places}
          onPick={(p) =>
            setStops((s) =>
              s.length >= MAX_STOPS || s.some((x) => x.id === p.id)
                ? s
                : [...s, p],
            )
          }
          label={`가고 싶은 곳 담기 (최대 ${MAX_STOPS}곳)`}
          placeholder="이름이나 지역 (예: 원주 온천, 설악산)"
          showCategory
          pickedIds={stops.map((p) => p.id)}
        />
        <PlacesLoadNote state={state} />
      </section>

      {stops.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/60 p-4 text-base leading-relaxed text-muted-foreground">
          파크골프장·온천·수영장·산·수목원을 골라 담으면 순서대로 이동 거리와
          차로 소요 시간을 계산합니다. 만든 코스는 주소 하나로 공유할 수
          있습니다.
        </p>
      ) : (
        <section className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold md:text-2xl">
              내 코스 ({stops.length}곳)
            </h2>
            {stops.length >= 3 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={optimize}
              >
                <Wand2 />
                가까운 순으로 정렬
              </Button>
            ) : null}
          </div>

          <ol className="mt-3 grid gap-2">
            {stops.map((p, i) => {
              const meta = CATEGORIES[p.category];
              const leg = i > 0 ? legs[i - 1] : null;
              return (
                <li key={p.id}>
                  {leg ? (
                    <p className="flex items-center gap-1.5 px-2 py-1 text-sm font-semibold text-muted-foreground">
                      <Navigation className="size-4" />
                      직선 {leg.km.toFixed(1)}km · 차로 약 {leg.minutes}분
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link
                        href={placeDetailPath(p.category, p.slug)}
                        className="block truncate font-semibold hover:underline"
                      >
                        {p.name}
                      </Link>
                      <span className="block truncate text-sm text-muted-foreground">
                        {meta.label} ·{" "}
                        {[p.region, p.city].filter(Boolean).join(" ")}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label={`${p.name} 위로`}
                        className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                      >
                        <ArrowUp className="size-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === stops.length - 1}
                        aria-label={`${p.name} 아래로`}
                        className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                      >
                        <ArrowDown className="size-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStops((s) => s.filter((x) => x.id !== p.id))
                        }
                        aria-label={`${p.name} 빼기`}
                        className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          {legs.length ? (
            <div className="mt-4 rounded-xl border-2 border-primary/25 bg-primary/5 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
                <Route className="size-4" />총 이동
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-foreground/85">
                직선 거리 합계{" "}
                <strong className="font-bold">{totalKm.toFixed(1)}km</strong>,
                차로 약{" "}
                <strong className="font-bold">{totalMin}분</strong>입니다. 실제
                도로 사정에 따라 달라질 수 있습니다.
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={copyShare} disabled={!stops.length}>
              {copied ? <Check /> : <Link2 />}
              {copied ? "주소를 복사했습니다" : "공유 주소 만들기"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStops([]);
                window.history.replaceState(
                  null,
                  "",
                  window.location.pathname,
                );
              }}
            >
              <Trash2 />
              모두 비우기
            </Button>
          </div>

          {copied && shareUrl ? (
            <p className="mt-3 break-all rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
              {shareUrl}
            </p>
          ) : null}
        </section>
      )}

      <p className="mt-4 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
        거리는 두 지점을 잇는 직선거리이고, 소요 시간은 이를 차로 환산한
        어림값입니다. 실제 경로는 각 장소 페이지의 카카오맵 길찾기로 확인하세요.
        만든 코스는 서버에 저장되지 않고 주소에만 담깁니다.
      </p>
    </div>
  );
}
