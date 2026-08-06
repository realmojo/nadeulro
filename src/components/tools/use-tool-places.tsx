"use client";

import { useEffect, useMemo, useState } from "react";

import type { Place, PlaceCategory } from "@/lib/places";
import { toToolPlaces, type ToolPlace } from "@/lib/tool-places";

/**
 * 장소 목록을 /api/places 에서 한 번만 받아 세션 내내 재사용한다.
 * 지도(/map)와 같은 엔드포인트라 브라우저·CDN 캐시를 함께 쓴다
 * (도구 HTML 에 3,200곳을 심으면 첫 로딩만 무거워진다).
 */
let cache: Promise<ToolPlace[]> | null = null;

function loadOnce(): Promise<ToolPlace[]> {
  if (!cache) {
    cache = fetch("/api/places")
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ places: Place[] }>)
          : Promise.reject(new Error(String(r.status))),
      )
      .then((d) => toToolPlaces(d.places))
      .catch((e) => {
        cache = null; // 실패는 캐시하지 않음 → 다음 진입 때 재시도
        throw e;
      });
  }
  return cache;
}

export type LoadState = "loading" | "ready" | "error";

/** @param filter 특정 카테고리만 받거나 "all" */
export function useToolPlaces(filter: PlaceCategory | "all") {
  const [all, setAll] = useState<ToolPlace[] | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let alive = true;
    loadOnce()
      .then((list) => {
        if (!alive) return;
        setAll(list);
        setState("ready");
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  const places = useMemo(() => {
    if (!all) return [];
    return filter === "all" ? all : all.filter((p) => p.category === filter);
  }, [all, filter]);

  return { places, state };
}

/** 목록을 불러오는 동안·실패했을 때 보여줄 안내 */
export function PlacesLoadNote({ state }: { state: LoadState }) {
  if (state === "loading") {
    return (
      <p
        aria-live="polite"
        className="mt-3 rounded-lg bg-muted/60 px-4 py-3 text-base text-muted-foreground"
      >
        장소 목록을 불러오는 중입니다…
      </p>
    );
  }
  if (state === "error") {
    return (
      <p
        role="alert"
        className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-base text-foreground/85"
      >
        장소 목록을 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해
        주세요.
      </p>
    );
  }
  return null;
}
