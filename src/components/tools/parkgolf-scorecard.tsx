"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  UserPlus,
} from "lucide-react";

import { PlacePicker } from "@/components/tools/place-picker";
import {
  PlacesLoadNote,
  useToolPlaces,
} from "@/components/tools/use-tool-places";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { placeDetailPath } from "@/lib/places";
import type { ToolPlace } from "@/lib/tool-places";

const STORAGE_KEY = "nadeulro:parkgolf-score:v1";
/** 파크골프는 홀당 파 3이 기본. 구장·홀마다 다를 수 있어 바꿀 수 있게 둔다. */
const DEFAULT_PAR = 3;
const MAX_PLAYERS = 4;

type Saved = {
  courseId: number | null;
  courseName: string;
  courseSlug: string | null;
  holes: number;
  players: string[];
  /** [홀][플레이어] 타수. 0 = 미입력 */
  scores: number[][];
  pars: number[];
  currentHole: number;
  date: string;
};

function emptyRound(holes: number, playerCount: number): Omit<Saved, "date"> {
  return {
    courseId: null,
    courseName: "",
    courseSlug: null,
    holes,
    players: Array.from({ length: playerCount }, (_, i) => `${i + 1}번`),
    scores: Array.from({ length: holes }, () =>
      Array.from({ length: playerCount }, () => 0),
    ),
    pars: Array.from({ length: holes }, () => DEFAULT_PAR),
    currentHole: 0,
  };
}

/** 오늘 날짜 (YYYY-MM-DD, 로컬) */
function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function ParkgolfScorecard() {
  const { places: courses, state } = useToolPlaces("parkgolf");
  const [round, setRound] = useState<Saved>(() => ({
    ...emptyRound(18, 2),
    date: today(),
  }));
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // 저장된 라운드 복원 (브라우저에만 저장, 서버로 보내지 않음).
  // localStorage 는 외부 저장소라 마운트 후 읽어야 한다 — 렌더 중에 읽으면
  // 서버 렌더 결과와 달라져 하이드레이션이 어긋난다.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Saved;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 저장소(localStorage) 복원
        if (parsed?.scores?.length) setRound(parsed);
      }
    } catch {
      /* 저장값이 깨졌으면 새 라운드로 시작 */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(round));
    } catch {
      /* 저장 실패(용량·시크릿 모드)해도 사용은 계속 가능 */
    }
  }, [round, loaded]);

  const totals = useMemo(
    () =>
      round.players.map((_, pi) =>
        round.scores.reduce((sum, row) => sum + (row[pi] || 0), 0),
      ),
    [round],
  );
  const playedPar = useMemo(
    () =>
      round.scores.reduce(
        (sum, row, hi) => (row.some((v) => v > 0) ? sum + round.pars[hi] : sum),
        0,
      ),
    [round],
  );
  const totalPar = useMemo(
    () => round.pars.reduce((a, b) => a + b, 0),
    [round.pars],
  );

  const setHoles = (holes: number) => {
    setRound((r) => ({
      ...r,
      holes,
      scores: Array.from({ length: holes }, (_, i) =>
        r.scores[i] ?? r.players.map(() => 0),
      ),
      pars: Array.from({ length: holes }, (_, i) => r.pars[i] ?? DEFAULT_PAR),
      currentHole: Math.min(r.currentHole, holes - 1),
    }));
  };

  const pickCourse = (p: ToolPlace) => {
    const holes = p.holes && p.holes > 0 ? p.holes : round.holes;
    setRound((r) => {
      const next = {
        ...r,
        courseId: p.id,
        courseName: p.name,
        courseSlug: p.slug,
      };
      return {
        ...next,
        holes,
        scores: Array.from({ length: holes }, (_, i) =>
          r.scores[i] ?? r.players.map(() => 0),
        ),
        pars: Array.from({ length: holes }, (_, i) => r.pars[i] ?? DEFAULT_PAR),
        currentHole: Math.min(r.currentHole, holes - 1),
      };
    });
  };

  const bump = (playerIdx: number, delta: number) => {
    setRound((r) => {
      const scores = r.scores.map((row) => [...row]);
      const cur = scores[r.currentHole][playerIdx] || 0;
      scores[r.currentHole][playerIdx] = Math.max(0, Math.min(20, cur + delta));
      return { ...r, scores };
    });
  };

  const addPlayer = () => {
    if (round.players.length >= MAX_PLAYERS) return;
    setRound((r) => ({
      ...r,
      players: [...r.players, `${r.players.length + 1}번`],
      scores: r.scores.map((row) => [...row, 0]),
    }));
  };

  const removePlayer = (idx: number) => {
    if (round.players.length <= 1) return;
    setRound((r) => ({
      ...r,
      players: r.players.filter((_, i) => i !== idx),
      scores: r.scores.map((row) => row.filter((_, i) => i !== idx)),
    }));
  };

  const reset = () => {
    if (!window.confirm("기록을 지우고 새 라운드를 시작할까요?")) return;
    setRound({
      ...emptyRound(round.holes, round.players.length),
      date: today(),
    });
  };

  const summaryText = useMemo(() => {
    const head = `${round.date} ${round.courseName || "파크골프"} ${round.holes}홀`;
    const lines = round.players.map((name, pi) => {
      const diff = totals[pi] - playedPar;
      const sign = diff === 0 ? "이븐" : diff > 0 ? `+${diff}` : `${diff}`;
      return `${name} ${totals[pi]}타 (${sign})`;
    });
    return [head, ...lines, "기록: 나들로 파크골프 스코어카드"].join("\n");
  }, [round, totals, playedPar]);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 클립보드 권한이 없으면 아래 텍스트를 직접 복사하면 된다 */
    }
  };

  const hole = round.currentHole;
  const holeScores = round.scores[hole] ?? [];

  return (
    <div className="mt-6">
      {/* 구장 선택 */}
      <section className="rounded-xl border border-border/70 bg-card p-4">
        <PlacePicker
          places={courses}
          onPick={pickCourse}
          label="구장 고르기 (선택)"
          placeholder="구장 이름이나 지역 (예: 원주, 한강)"
        />
        <PlacesLoadNote state={state} />
        {round.courseName ? (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
            <span className="font-semibold">{round.courseName}</span>
            {round.courseSlug ? (
              <Link
                href={placeDetailPath("parkgolf", round.courseSlug)}
                className="text-sm font-semibold text-primary hover:underline"
              >
                구장 정보 보기
              </Link>
            ) : null}
          </p>
        ) : null}

        <div className="mt-4">
          <span className="block text-base font-semibold text-foreground/90">
            홀 수
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {[9, 18, 27, 36].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHoles(h)}
                aria-pressed={round.holes === h}
                className={`min-h-11 rounded-lg border px-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  round.holes === h
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                {h}홀
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 플레이어 */}
      <section className="mt-4 rounded-xl border border-border/70 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold text-foreground/90">
            함께 치는 사람 ({round.players.length}명)
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPlayer}
            disabled={round.players.length >= MAX_PLAYERS}
          >
            <UserPlus />
            추가
          </Button>
        </div>
        <ul className="mt-3 grid gap-2">
          {round.players.map((name, i) => (
            <li key={i} className="flex items-center gap-2">
              <Input
                value={name}
                aria-label={`${i + 1}번째 사람 이름`}
                onChange={(e) =>
                  setRound((r) => ({
                    ...r,
                    players: r.players.map((p, pi) =>
                      pi === i ? e.target.value : p,
                    ),
                  }))
                }
              />
              <button
                type="button"
                onClick={() => removePlayer(i)}
                disabled={round.players.length <= 1}
                aria-label={`${name} 빼기`}
                className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              >
                <Trash2 className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 현재 홀 입력 */}
      <section className="mt-4 rounded-xl border-2 border-primary/25 bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setRound((r) => ({
                ...r,
                currentHole: Math.max(0, r.currentHole - 1),
              }))
            }
            disabled={hole === 0}
            aria-label="이전 홀"
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-input transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            <ChevronLeft className="size-6" />
          </button>

          <div className="text-center">
            <p className="font-display text-2xl font-bold">{hole + 1}번 홀</p>
            <label className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              기준 타수
              <select
                value={round.pars[hole] ?? DEFAULT_PAR}
                onChange={(e) =>
                  setRound((r) => ({
                    ...r,
                    pars: r.pars.map((p, i) =>
                      i === r.currentHole ? Number(e.target.value) : p,
                    ),
                  }))
                }
                className="h-10 rounded-md border border-input bg-background px-2 text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {[3, 4, 5].map((p) => (
                  <option key={p} value={p}>
                    파 {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() =>
              setRound((r) => ({
                ...r,
                currentHole: Math.min(r.holes - 1, r.currentHole + 1),
              }))
            }
            disabled={hole >= round.holes - 1}
            aria-label="다음 홀"
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-input transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>

        <ul className="mt-4 grid gap-3">
          {round.players.map((name, pi) => {
            const v = holeScores[pi] || 0;
            return (
              <li
                key={pi}
                className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
              >
                <span className="min-w-0 flex-1 truncate text-lg font-semibold">
                  {name}
                </span>
                <button
                  type="button"
                  onClick={() => bump(pi, -1)}
                  aria-label={`${name} 타수 빼기`}
                  className="flex size-12 shrink-0 items-center justify-center rounded-full border border-input bg-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Minus className="size-6" />
                </button>
                <span
                  aria-live="polite"
                  className="w-10 shrink-0 text-center text-2xl font-bold tabular-nums"
                >
                  {v || "–"}
                </span>
                <button
                  type="button"
                  onClick={() => bump(pi, 1)}
                  aria-label={`${name} 타수 더하기`}
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus className="size-6" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 합계 */}
      <section className="mt-4 rounded-xl border border-border/70 bg-card p-4">
        <h2 className="font-display text-xl font-bold">합계</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          기록한 홀의 기준 타수 합계는 {playedPar}타입니다 (전체 {round.holes}홀
          기준 {totalPar}타).
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th scope="col" className="py-2 pr-2 font-medium">
                  이름
                </th>
                <th scope="col" className="py-2 pr-2 font-medium">
                  타수
                </th>
                <th scope="col" className="py-2 font-medium">
                  기준 대비
                </th>
              </tr>
            </thead>
            <tbody>
              {round.players.map((name, pi) => {
                const diff = totals[pi] - playedPar;
                return (
                  <tr key={pi} className="border-b border-border/50">
                    <th
                      scope="row"
                      className="py-2 pr-2 text-left font-semibold"
                    >
                      {name}
                    </th>
                    <td className="py-2 pr-2 font-bold tabular-nums">
                      {totals[pi]}
                    </td>
                    <td className="py-2 font-semibold tabular-nums">
                      {totals[pi] === 0
                        ? "–"
                        : diff === 0
                          ? "이븐"
                          : diff > 0
                            ? `+${diff}`
                            : diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={copySummary}>
            {copied ? <Check /> : <Copy />}
            {copied ? "복사했습니다" : "결과 복사"}
          </Button>
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw />새 라운드
          </Button>
        </div>
      </section>

      <p className="mt-4 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
        기록은 이 브라우저에만 저장되며 서버로 전송되지 않습니다. 창을 닫았다
        열어도 이어서 쓸 수 있지만, 브라우저 기록을 지우면 함께 사라집니다.
        홀별 기준 타수는 구장마다 다를 수 있어 파 3을 기본값으로 두었습니다.
      </p>
    </div>
  );
}
