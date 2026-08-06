"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Mountain, Timer } from "lucide-react";

import { PlacePicker } from "@/components/tools/place-picker";
import {
  PlacesLoadNote,
  useToolPlaces,
} from "@/components/tools/use-tool-places";
import { Input } from "@/components/ui/input";
import {
  DESCENTS,
  PACES,
  estimateHike,
  formatDuration,
  type DescentKey,
  type PaceKey,
} from "@/lib/hiking-pace";
import { placeDetailPath } from "@/lib/places";
import type { ToolPlace } from "@/lib/tool-places";
import { toolByKey } from "@/lib/tools";

export function HikingPacePlanner() {
  const { places: mountains, state } = useToolPlaces("hiking");
  const [mountain, setMountain] = useState<ToolPlace | null>(null);
  const [distanceKm, setDistanceKm] = useState("6");
  const [ascentM, setAscentM] = useState("500");
  const [descent, setDescent] = useState<DescentKey>("gentle");
  const [pace, setPace] = useState<PaceKey>("normal");
  const [packKg, setPackKg] = useState("5");

  const result = useMemo(() => {
    const d = Number.parseFloat(distanceKm);
    const a = Number.parseFloat(ascentM);
    if (!Number.isFinite(d) || d <= 0) return null;
    const asc = Number.isFinite(a) ? a : 0;
    return estimateHike({
      distanceKm: d,
      ascentM: asc,
      descentM: asc, // 왕복 기준: 오른 만큼 내려온다
      descent,
      pace,
      packKg: Number.parseFloat(packKg) || 0,
      restMin: null,
    });
  }, [distanceKm, ascentM, descent, pace, packKg]);

  const timeTool = toolByKey("hiking-time");

  return (
    <div className="mt-6">
      {/* 산 고르기 — 선택 사항이지만 고르면 높이를 참고값으로 보여준다 */}
      <section className="rounded-xl border border-border/70 bg-card p-4">
        <PlacePicker
          places={mountains}
          onPick={setMountain}
          label="어느 산인가요 (선택)"
          placeholder="산 이름이나 지역 (예: 북한산, 강원)"
        />
        <PlacesLoadNote state={state} />
        {mountain ? (
          <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Mountain className="size-5 shrink-0 text-primary/70" />
              <span className="font-semibold">{mountain.name}</span>
              {mountain.height ? (
                <span className="text-sm text-muted-foreground">
                  정상 해발 {mountain.height.toLocaleString()}m
                </span>
              ) : null}
              <Link
                href={placeDetailPath("hiking", mountain.slug)}
                className="text-sm font-semibold text-primary hover:underline"
              >
                산 정보 보기
              </Link>
            </p>
            <p className="mt-1.5 break-keep text-sm leading-relaxed text-muted-foreground">
              정상 해발은 들머리에서부터의 고도 상승과 다릅니다. 들머리가 이미
              높은 곳에 있으면 실제 상승은 훨씬 적습니다. 아래 값은 다니려는
              코스 기준으로 직접 넣어 주세요.
            </p>
          </div>
        ) : null}
      </section>

      {/* 코스 입력 */}
      <section className="mt-4 rounded-xl border border-border/70 bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="hp-distance"
              className="block text-base font-semibold text-foreground/90"
            >
              왕복 거리 (km)
            </label>
            <Input
              id="hp-distance"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label
              htmlFor="hp-ascent"
              className="block text-base font-semibold text-foreground/90"
            >
              총 고도 상승 (m)
            </label>
            <Input
              id="hp-ascent"
              type="number"
              inputMode="numeric"
              min="0"
              step="50"
              value={ascentM}
              onChange={(e) => setAscentM(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-base font-semibold text-foreground/90">
            걷는 속도
          </legend>
          <div className="mt-2 grid gap-2">
            {PACES.map((p) => (
              <label
                key={p.key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                  pace === p.key
                    ? "border-primary bg-primary/5"
                    : "border-border/70 hover:bg-accent/40"
                }`}
              >
                <input
                  type="radio"
                  name="pace"
                  value={p.key}
                  checked={pace === p.key}
                  onChange={() => setPace(p.key)}
                  className="mt-1 size-5 shrink-0 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block font-semibold">{p.label}</span>
                  <span className="block break-keep text-sm leading-relaxed text-muted-foreground">
                    {p.note}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-base font-semibold text-foreground/90">
              내리막 경사
            </span>
            <div className="mt-2 flex gap-2">
              {DESCENTS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDescent(d.key)}
                  aria-pressed={descent === d.key}
                  className={`min-h-11 flex-1 rounded-lg border px-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    descent === d.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 break-keep text-sm leading-relaxed text-muted-foreground">
              {DESCENTS.find((d) => d.key === descent)?.note}
            </p>
          </div>
          <div>
            <label
              htmlFor="hp-pack"
              className="block text-base font-semibold text-foreground/90"
            >
              배낭 무게 (kg)
            </label>
            <Input
              id="hp-pack"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={packKg}
              onChange={(e) => setPackKg(e.target.value)}
              className="mt-2"
            />
            <p className="mt-1.5 break-keep text-sm leading-relaxed text-muted-foreground">
              5kg 을 넘는 무게부터 속도에 반영합니다.
            </p>
          </div>
        </div>
      </section>

      {result ? (
        <>
          <section className="mt-4 rounded-xl border-2 border-primary/25 bg-primary/5 p-5">
            <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
              <Timer className="size-4" />
              예상 소요 시간 · {result.grade.label}
            </p>
            <p className="font-display mt-1 text-4xl font-bold tabular-nums text-primary">
              {formatDuration(result.totalMin)}
            </p>
            <p className="mt-2 break-keep text-base leading-relaxed text-foreground/85">
              {result.grade.note} 걷는 평균 속도는 시속{" "}
              {result.avgKmh}km 정도입니다.
            </p>

            <Link
              href={`${timeTool.path}?minutes=${result.totalMin}`}
              className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-persimmon px-5 text-base font-bold text-persimmon-foreground shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              이 시간으로 출발 시각 계산하기
              <ArrowRight className="size-5" />
            </Link>
          </section>

          <section className="mt-4">
            <h2 className="font-display text-xl font-bold md:text-2xl">
              시간이 어떻게 나왔나요
            </h2>
            <dl className="mt-3 divide-y divide-border rounded-xl border border-border/70">
              {[
                { k: "거리에서", v: `${result.distanceMin}분`, s: `${distanceKm}km × 12분` },
                { k: "오르막에서", v: `${result.ascentMin}분`, s: `${ascentM}m ÷ 100 × 10분` },
                {
                  k: "내리막 보정",
                  v: `${result.descentAdjustMin >= 0 ? "+" : ""}${result.descentAdjustMin}분`,
                  s: descent === "gentle" ? "완만한 내리막은 단축" : "가파른 내리막은 추가",
                },
                { k: "속도 반영", v: `+${result.paceAddMin}분`, s: PACES.find((p) => p.key === pace)?.label },
                { k: "배낭 무게", v: `+${result.packAddMin}분`, s: `${packKg}kg` },
                { k: "휴식·식사", v: `+${result.restMin}분`, s: "걷는 시간 2시간마다 15분" },
              ].map((row) => (
                <div key={row.k} className="flex items-baseline gap-3 px-4 py-3">
                  <dt className="w-24 shrink-0 text-base text-muted-foreground">
                    {row.k}
                  </dt>
                  <dd className="flex-1">
                    <span className="font-bold tabular-nums">{row.v}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {row.s}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : (
        <p className="mt-4 rounded-xl bg-muted/60 p-4 text-base leading-relaxed text-muted-foreground">
          왕복 거리를 입력하면 예상 소요 시간을 계산합니다.
        </p>
      )}

      <p className="mt-6 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
        네이스미스 규칙(평지 1km당 12분, 고도 100m당 10분)에 랭뮤어 하강 보정을
        더한 추정값입니다. 원래 이 규칙은 체력 좋은 등산객이 쉬지 않고 걷는 것을
        전제하므로, 여기서는 속도 계수와 휴식 시간을 더해 넉넉한 쪽으로
        잡았습니다. 눈길·빙판·폭염에서는 계산값보다 훨씬 오래 걸립니다.
      </p>
    </div>
  );
}
