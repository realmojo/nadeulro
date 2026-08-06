"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Droplets, Snowflake, Sun, Wind } from "lucide-react";

import { Input } from "@/components/ui/input";
import { assess, type RiskLevel, type Season } from "@/lib/weather-comfort";

/** 위험도 → 색 (토큰 기반, 하드코딩 색 금지 규칙 준수) */
const LEVEL_STYLE: Record<
  RiskLevel,
  { box: string; text: string; bar: string }
> = {
  safe: {
    box: "border-primary/25 bg-primary/5",
    text: "text-primary",
    bar: "bg-primary",
  },
  caution: {
    box: "border-persimmon/30 bg-persimmon/5",
    text: "text-persimmon",
    bar: "bg-persimmon",
  },
  warning: {
    box: "border-persimmon/50 bg-persimmon/10",
    text: "text-persimmon",
    bar: "bg-persimmon",
  },
  danger: {
    box: "border-destructive/40 bg-destructive/5",
    text: "text-destructive",
    bar: "bg-destructive",
  },
};

const LEVEL_ORDER: RiskLevel[] = ["safe", "caution", "warning", "danger"];

export function WeatherSafety() {
  const [season, setSeason] = useState<Season>("summer");
  const [tempC, setTempC] = useState("30");
  const [humidity, setHumidity] = useState("65");
  const [windKmh, setWindKmh] = useState("15");

  const result = useMemo(() => {
    const t = Number.parseFloat(tempC);
    if (!Number.isFinite(t)) return null;
    const second =
      season === "summer"
        ? Number.parseFloat(humidity)
        : Number.parseFloat(windKmh);
    if (!Number.isFinite(second)) return null;
    return assess(season, t, second);
  }, [season, tempC, humidity, windKmh]);

  const style = result ? LEVEL_STYLE[result.level] : null;
  const temp = Number.parseFloat(tempC);
  const diff = result && Number.isFinite(temp) ? result.feelsLikeC - temp : 0;

  return (
    <div className="mt-6">
      {/* 계절 선택 — 여름은 습도, 겨울은 바람이 결정적이다 */}
      <div
        role="group"
        aria-label="계절 선택"
        className="grid grid-cols-2 gap-2"
      >
        {(
          [
            { key: "summer", label: "여름 (더위)", icon: <Sun className="size-5" /> },
            { key: "winter", label: "겨울 (추위)", icon: <Snowflake className="size-5" /> },
          ] as const
        ).map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSeason(s.key)}
            aria-pressed={season === s.key}
            className={`flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 text-lg font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              season === s.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 bg-card hover:bg-accent/40"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      <section className="mt-4 rounded-xl border border-border/70 bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ws-temp"
              className="block text-base font-semibold text-foreground/90"
            >
              기온 (℃)
            </label>
            <Input
              id="ws-temp"
              type="number"
              inputMode="decimal"
              step="0.5"
              value={tempC}
              onChange={(e) => setTempC(e.target.value)}
              className="mt-2"
            />
          </div>

          {season === "summer" ? (
            <div>
              <label
                htmlFor="ws-humidity"
                className="flex items-center gap-1.5 text-base font-semibold text-foreground/90"
              >
                <Droplets className="size-4 text-primary/70" />
                상대습도 (%)
              </label>
              <Input
                id="ws-humidity"
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                step="5"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="mt-2"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="ws-wind"
                className="flex items-center gap-1.5 text-base font-semibold text-foreground/90"
              >
                <Wind className="size-4 text-primary/70" />
                풍속 (km/h)
              </label>
              <Input
                id="ws-wind"
                type="number"
                inputMode="decimal"
                min="0"
                step="1"
                value={windKmh}
                onChange={(e) => setWindKmh(e.target.value)}
                className="mt-2"
              />
            </div>
          )}
        </div>
        <p className="mt-3 break-keep text-sm leading-relaxed text-muted-foreground">
          {season === "summer"
            ? "기상청 예보나 날씨 앱의 기온·습도를 그대로 넣으세요. 습도가 높을수록 땀이 증발하지 못해 실제보다 훨씬 덥게 느껴집니다."
            : "산 능선은 지상보다 바람이 훨씬 셉니다. 예보 풍속보다 한 단계 높게 잡아 보는 편이 안전합니다."}
        </p>
      </section>

      {result && style ? (
        <>
          <section className={`mt-4 rounded-xl border-2 p-5 ${style.box}`}>
            <p className={`text-sm font-bold ${style.text}`}>
              {season === "summer" ? "열지수" : "체감온도"} · {result.label}
            </p>
            <p
              className={`font-display mt-1 text-4xl font-bold tabular-nums ${style.text}`}
            >
              {result.feelsLikeC.toFixed(1)}℃
            </p>
            <p className="mt-1 text-base text-foreground/80">
              기온 {temp}℃ 인데 몸이 느끼는 온도는{" "}
              {Math.abs(diff) < 0.5
                ? "거의 같습니다"
                : `${Math.abs(diff).toFixed(1)}℃ ${diff > 0 ? "더 덥습니다" : "더 춥습니다"}`}
              .
            </p>
            <p className="mt-3 break-keep text-base font-semibold leading-relaxed text-foreground/90">
              {result.headline}
            </p>

            {/* 위험 단계 눈금 */}
            <ul className="mt-4 flex gap-1" aria-hidden="true">
              {LEVEL_ORDER.map((lv) => (
                <li
                  key={lv}
                  className={`h-2 flex-1 rounded-full ${
                    LEVEL_ORDER.indexOf(lv) <= LEVEL_ORDER.indexOf(result.level)
                      ? LEVEL_STYLE[lv].bar
                      : "bg-border"
                  }`}
                />
              ))}
            </ul>
            <p className="mt-1.5 text-sm text-muted-foreground">
              무리 없음 · 주의 · 경고 · 위험 4단계 중 {result.label}
            </p>
          </section>

          <section className="mt-4">
            <h2 className="font-display text-xl font-bold md:text-2xl">
              오늘은 이렇게 하세요
            </h2>
            <ul className="mt-3 grid gap-2">
              {result.advice.map((a) => (
                <li
                  key={a}
                  className="flex gap-2.5 rounded-xl border border-border/70 bg-card p-3"
                >
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary/70" />
                  <span className="break-keep text-base leading-relaxed text-foreground/85">
                    {a}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <p className="mt-6 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
        열지수는 미국 기상청 Rothfusz 회귀식, 체감온도는 2001년 개정 체감온도
        공식으로 계산합니다. 그늘·햇볕 직사·복사열은 반영되지 않으므로 땡볕에
        오래 서 있는 파크골프장은 계산값보다 더 위험합니다. 지병이 있다면 이
        결과와 무관하게 주치의 안내를 우선하세요.
      </p>
    </div>
  );
}
