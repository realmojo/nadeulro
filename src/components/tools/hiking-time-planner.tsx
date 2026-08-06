"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Mountain, Sunrise, Sunset } from "lucide-react";

import { PlacePicker } from "@/components/tools/place-picker";
import {
  PlacesLoadNote,
  useToolPlaces,
} from "@/components/tools/use-tool-places";
import { placeDetailPath } from "@/lib/places";
import type { ToolPlace } from "@/lib/tool-places";
import { formatMin, sunTimes } from "@/lib/sun";

/** 완전히 어두워지기 전 하산을 마치기 위한 여유 */
const FINISH_BEFORE_SUNSET_MIN = 30;
/** '여유 있게' 권장 출발은 마지노선보다 이만큼 이르게 */
const RELAXED_EARLIER_MIN = 60;

const DURATION_OPTIONS = [60, 90, 120, 150, 180, 240, 300, 360, 420, 480];

function durationLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function HikingTimePlanner() {
  const { places: mountains, state } = useToolPlaces("hiking");
  const [mountain, setMountain] = useState<ToolPlace | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [duration, setDuration] = useState<number>(180);
  /** 소요 시간 계산기에서 넘어온 값 — 목록에 없는 시간이면 항목으로 추가한다 */
  const [handoff, setHandoff] = useState<number | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("minutes");
    const m = Math.round(Number(raw));
    if (!Number.isFinite(m) || m < 30 || m > 900) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 상태(주소창 쿼리) 복원
    setDuration(m);
    if (!DURATION_OPTIONS.includes(m)) setHandoff(m);
  }, []);

  const durationOptions = useMemo(
    () =>
      handoff
        ? [...DURATION_OPTIONS, handoff].sort((a, b) => a - b)
        : DURATION_OPTIONS,
    [handoff],
  );

  const result = useMemo(() => {
    if (!mountain) return null;
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return null;
    const { sunriseMin, sunsetMin } = sunTimes(mountain.lat, mountain.lng, y, m, d);
    if (sunriseMin == null || sunsetMin == null) return null;

    const finishBy = sunsetMin - FINISH_BEFORE_SUNSET_MIN;
    const latestStart = finishBy - duration;
    const relaxedStart = latestStart - RELAXED_EARLIER_MIN;
    const daylight = sunsetMin - sunriseMin;

    return {
      sunrise: sunriseMin,
      sunset: sunsetMin,
      finishBy,
      latestStart,
      relaxedStart,
      daylight,
      /** 낮 시간보다 산행이 길면 그날 당일 산행은 불가능 */
      tooLong: latestStart < sunriseMin,
    };
  }, [mountain, date, duration]);

  return (
    <div className="mt-6">
      <section className="rounded-xl border border-border/70 bg-card p-4">
        <PlacePicker
          places={mountains}
          onPick={setMountain}
          label="어느 산에 가시나요"
          placeholder="산 이름이나 지역 (예: 설악, 북한산, 경남)"
        />
        <PlacesLoadNote state={state} />

        {mountain ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-muted/50 px-3 py-2.5">
            <Mountain className="size-5 shrink-0 text-primary/70" />
            <span className="font-semibold">{mountain.name}</span>
            <span className="text-sm text-muted-foreground">
              {[mountain.region, mountain.city].filter(Boolean).join(" ")}
              {mountain.height
                ? ` · 해발 ${mountain.height.toLocaleString()}m`
                : ""}
            </span>
            <Link
              href={placeDetailPath("hiking", mountain.slug)}
              className="text-sm font-semibold text-primary hover:underline"
            >
              산 정보 보기
            </Link>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="hike-date"
              className="block text-base font-semibold text-foreground/90"
            >
              가는 날
            </label>
            <input
              id="hike-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3.5 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label
              htmlFor="hike-duration"
              className="block text-base font-semibold text-foreground/90"
            >
              예상 산행 시간 (왕복)
            </label>
            <select
              id="hike-duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {durationOptions.map((m) => (
                <option key={m} value={m}>
                  {durationLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {!mountain ? (
        <p className="mt-4 rounded-xl bg-muted/60 p-4 text-base leading-relaxed text-muted-foreground">
          산을 고르면 그 산의 좌표로 해당 날짜의 일출·일몰을 계산해, 어두워지기
          전에 내려오려면 몇 시에 출발해야 하는지 알려드립니다.
        </p>
      ) : null}

      {result && mountain ? (
        <>
          {result.tooLong ? (
            <div className="mt-4 rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4">
              <p className="flex items-center gap-2 text-base font-bold text-destructive">
                <AlertTriangle className="size-5" />이 날짜에는 당일 산행이
                어렵습니다
              </p>
              <p className="mt-1.5 break-keep text-base leading-relaxed text-foreground/85">
                {date} {mountain.name}의 낮 시간은{" "}
                {durationLabel(result.daylight)}인데, 예상 산행 시간이{" "}
                {durationLabel(duration)}입니다. 해 뜨자마자 출발해도 어두워지기
                전에 내려오기 어렵습니다. 코스를 줄이거나 낮이 긴 계절로 날짜를
                옮기는 편이 안전합니다.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border-2 border-primary/25 bg-primary/5 p-5">
              <p className="text-base font-semibold text-foreground/80">
                {date} · {mountain.name}
              </p>
              <p className="mt-2 text-base text-foreground/85">
                늦어도 이 시각에는 출발하세요
              </p>
              <p className="font-display mt-1 text-4xl font-bold tabular-nums text-primary">
                {formatMin(result.latestStart)}
              </p>
              <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
                여유 있게 다녀오려면{" "}
                <strong className="font-bold">
                  {formatMin(result.relaxedStart)}
                </strong>{" "}
                출발을 권합니다. {durationLabel(duration)} 걸린다고 보면{" "}
                {formatMin(result.finishBy)}에는 하산을 마치게 되어, 일몰{" "}
                {formatMin(result.sunset)}보다 {FINISH_BEFORE_SUNSET_MIN}분
                앞섭니다.
              </p>
            </div>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              icon={<Sunrise className="size-5 text-primary/70" />}
              label="일출"
              value={formatMin(result.sunrise)}
            />
            <Stat
              icon={<Sunset className="size-5 text-primary/70" />}
              label="일몰"
              value={formatMin(result.sunset)}
            />
            <Stat label="낮 길이" value={durationLabel(result.daylight)} />
            <Stat
              label="하산 완료 목표"
              value={formatMin(result.finishBy)}
            />
          </dl>

          <p className="mt-4 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
            일출·일몰은 {mountain.name}의 좌표({mountain.lat.toFixed(3)},{" "}
            {mountain.lng.toFixed(3)})로 계산한 한국 표준시 값입니다. 산속은
            능선과 골짜기에 해가 가리면 일몰 전부터 어두워지므로, 계산값보다
            이르게 움직이는 편이 안전합니다. 예상 산행 시간에는 휴식과 식사
            시간을 포함해 넉넉히 잡으세요.
          </p>
        </>
      ) : null}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 text-xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}
