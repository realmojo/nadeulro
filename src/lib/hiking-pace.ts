/**
 * 산행 소요 시간 추정 — Naismith 규칙 + Langmuir 하강 보정.
 *
 * 기준: 평지 5km/h(1km당 12분) + 고도 상승 100m당 10분.
 * Naismith 는 '체력 좋은 등산객이 쉬지 않고 걷는' 전제라 실제보다 짧게 나온다.
 * 그래서 페이스 계수와 휴식 시간을 따로 두고, 기본값을 넉넉한 쪽으로 잡는다.
 * (어른 나들이 기준으로 과소 추정은 위험 쪽으로 틀리는 것이므로)
 */

/** 평지 1km 당 분 */
const MIN_PER_KM = 12;
/** 고도 상승 100m 당 분 */
const MIN_PER_100M_UP = 10;

export type PaceKey = "relaxed" | "normal" | "brisk";

export const PACES: Array<{ key: PaceKey; label: string; factor: number; note: string }> =
  [
    {
      key: "relaxed",
      label: "천천히",
      factor: 1.45,
      note: "경치를 보며 여유 있게. 오르막에서 자주 숨을 고르는 속도",
    },
    {
      key: "normal",
      label: "보통",
      factor: 1.25,
      note: "동네 뒷산을 무리 없이 오르내리는 일반적인 속도",
    },
    {
      key: "brisk",
      label: "빠르게",
      factor: 1.0,
      note: "평소 산행이 잦고 체력에 자신 있는 경우",
    },
  ];

/** 하강 구간 경사 — Langmuir 보정의 방향이 갈린다 */
export type DescentKey = "gentle" | "steep";

export const DESCENTS: Array<{ key: DescentKey; label: string; note: string }> = [
  {
    key: "gentle",
    label: "완만함",
    note: "완만한 내리막에서는 오히려 시간이 조금 줄어듭니다",
  },
  {
    key: "steep",
    label: "가파름",
    note: "가파른 내리막은 조심해서 내려오느라 시간이 더 걸립니다",
  },
];

export type HikeInput = {
  /** 왕복 총 거리(km) */
  distanceKm: number;
  /** 총 고도 상승(m) */
  ascentM: number;
  /** 총 고도 하강(m). 왕복이면 보통 상승과 같다 */
  descentM: number;
  descent: DescentKey;
  pace: PaceKey;
  /** 배낭 무게(kg) — 체중의 20%를 넘으면 눈에 띄게 느려진다 */
  packKg: number;
  /** 휴식·식사 시간(분). 0이면 자동 추정 */
  restMin: number | null;
};

export type HikeResult = {
  /** Naismith 기본 시간(분) — 보정 전 */
  baseMin: number;
  /** 거리에서 오는 몫(분) */
  distanceMin: number;
  /** 오르막에서 오는 몫(분) */
  ascentMin: number;
  /** Langmuir 하강 보정(분, 음수면 단축) */
  descentAdjustMin: number;
  /** 페이스 계수 적용으로 늘어난 분 */
  paceAddMin: number;
  /** 배낭 하중으로 늘어난 분 */
  packAddMin: number;
  /** 휴식 시간(분) */
  restMin: number;
  /** 최종 총 소요(분) */
  totalMin: number;
  /** 평균 속도(km/h) */
  avgKmh: number;
  grade: { label: string; note: string };
};

/** Langmuir: 완만한 내리막은 300m 당 10분 단축, 가파르면 300m 당 10분 추가 */
function langmuir(descentM: number, kind: DescentKey): number {
  const units = descentM / 300;
  return kind === "gentle" ? -units * 10 : units * 10;
}

/** 휴식 자동 추정 — 걷는 시간 2시간마다 15분 */
function autoRest(movingMin: number): number {
  return Math.round(movingMin / 120) * 15;
}

function gradeOf(totalMin: number, ascentM: number) {
  if (totalMin <= 120 && ascentM <= 300) {
    return { label: "가볍게", note: "동네 뒷산 수준으로 부담이 적은 일정입니다." };
  }
  if (totalMin <= 240 && ascentM <= 700) {
    return {
      label: "보통",
      note: "반나절 산행입니다. 물과 간식을 챙기면 무리 없습니다.",
    };
  }
  if (totalMin <= 420) {
    return {
      label: "긴 산행",
      note: "하루를 온전히 쓰는 일정입니다. 출발 시각을 앞당기고 헤드랜턴을 챙기세요.",
    };
  }
  return {
    label: "매우 긴 산행",
    note: "일곱 시간을 넘습니다. 체력과 일몰 시각을 반드시 함께 확인하고, 무리라면 코스를 줄이세요.",
  };
}

export function estimateHike(input: HikeInput): HikeResult | null {
  const { distanceKm, ascentM, descentM, descent, pace, packKg } = input;
  if (!(distanceKm > 0)) return null;

  const distanceMin = distanceKm * MIN_PER_KM;
  const ascentMin = (Math.max(0, ascentM) / 100) * MIN_PER_100M_UP;
  const descentAdjustMin = langmuir(Math.max(0, descentM), descent);
  const baseMin = Math.max(1, distanceMin + ascentMin + descentAdjustMin);

  const factor = PACES.find((p) => p.key === pace)?.factor ?? 1.25;
  const paced = baseMin * factor;
  const paceAddMin = paced - baseMin;

  // 배낭 하중: 5kg 을 넘는 무게 1kg 당 걷는 시간의 1.5% 씩 가산(경험칙)
  const overload = Math.max(0, packKg - 5);
  const packAddMin = paced * (overload * 0.015);

  const movingMin = paced + packAddMin;
  const restMin = input.restMin ?? autoRest(movingMin);
  const totalMin = Math.round(movingMin + restMin);

  return {
    baseMin: Math.round(baseMin),
    distanceMin: Math.round(distanceMin),
    ascentMin: Math.round(ascentMin),
    descentAdjustMin: Math.round(descentAdjustMin),
    paceAddMin: Math.round(paceAddMin),
    packAddMin: Math.round(packAddMin),
    restMin: Math.round(restMin),
    totalMin,
    avgKmh: Math.round((distanceKm / (totalMin / 60)) * 10) / 10,
    grade: gradeOf(totalMin, ascentM),
  };
}

/** 분 → "4시간 20분" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}
