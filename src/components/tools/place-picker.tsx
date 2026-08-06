"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/places";
import type { ToolPlace } from "@/lib/tool-places";

/**
 * 장소 검색 선택 — 도구 3개가 공유.
 * 목록이 수천 개라 전부 그리지 않고 검색어가 있을 때만 상위 N개를 보여준다.
 */
export function PlacePicker({
  places,
  onPick,
  placeholder,
  label,
  showCategory = false,
  /** 이미 담은 곳은 목록에서 흐리게 + 중복 선택 방지 */
  pickedIds = [],
}: {
  places: ToolPlace[];
  onPick: (p: ToolPlace) => void;
  placeholder: string;
  label: string;
  showCategory?: boolean;
  pickedIds?: number[];
}) {
  const [q, setQ] = useState("");
  const picked = useMemo(() => new Set(pickedIds), [pickedIds]);

  const results = useMemo(() => {
    const term = q.trim();
    if (term.length < 1) return [];
    // 이름 우선, 지역·시군구도 함께 검색 ("원주 파크골프" 처럼 입력해도 찾히게)
    const parts = term.split(/\s+/);
    return places
      .filter((p) => {
        const hay = `${p.name} ${p.region ?? ""} ${p.city ?? ""}`;
        return parts.every((w) => hay.includes(w));
      })
      .slice(0, 30);
  }, [q, places]);

  return (
    <div>
      <label
        htmlFor="place-search"
        className="block text-base font-semibold text-foreground/90"
      >
        {label}
      </label>
      <div className="relative mt-2">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="place-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="pl-11 pr-11"
          autoComplete="off"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="검색어 지우기"
            className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      {q.trim() && results.length === 0 ? (
        <p className="mt-3 rounded-lg bg-muted/60 px-4 py-3 text-base text-muted-foreground">
          &lsquo;{q}&rsquo; 와(과) 맞는 곳을 찾지 못했습니다. 이름 일부만
          입력하거나 지역명을 함께 넣어 보세요.
        </p>
      ) : null}

      {results.length ? (
        <ul className="mt-3 max-h-80 divide-y divide-border overflow-y-auto rounded-xl border border-border/70">
          {results.map((p) => {
            const already = picked.has(p.id);
            const meta = CATEGORIES[p.category];
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={already}
                  onClick={() => {
                    onPick(p);
                    setQ("");
                  }}
                  className="flex min-h-13 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-45"
                >
                  {showCategory ? (
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {p.name}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {showCategory ? `${meta.label} · ` : ""}
                      {[p.region, p.city].filter(Boolean).join(" ")}
                      {p.holes ? ` · ${p.holes}홀` : ""}
                      {p.height ? ` · 해발 ${p.height.toLocaleString()}m` : ""}
                    </span>
                  </span>
                  {already ? (
                    <span className="shrink-0 text-sm font-semibold text-muted-foreground">
                      담음
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
