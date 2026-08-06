/**
 * 야외 활동 안전 지표 — 열지수(여름)와 체감온도(겨울).
 *
 * 기온만 보면 판단을 그르친다. 여름엔 습도가, 겨울엔 바람이 실제 위험을
 * 좌우한다. 두 공식 모두 미국 기상청(NWS)이 쓰는 표준식이다.
 * 어른 나들이는 온열질환·저체온 위험이 더 크므로 경고 구간을 보수적으로 잡는다.
 */

const toF = (c: number) => (c * 9) / 5 + 32;
const toC = (f: number) => ((f - 32) * 5) / 9;

/**
 * 열지수(체감 더위) — NWS Rothfusz 회귀식.
 * @param tempC 기온(℃), @param rh 상대습도(%)
 * @returns 체감 온도(℃)
 */
export function heatIndexC(tempC: number, rh: number): number {
  const T = toF(tempC);
  const R = Math.min(100, Math.max(0, rh));

  // 27℃(80℉) 아래에서는 회귀식이 맞지 않아 단순식을 쓴다
  const simple = 0.5 * (T + 61 + (T - 68) * 1.2 + R * 0.094);
  if ((simple + T) / 2 < 80) return toC(simple);

  let hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    6.83783e-3 * T * T -
    5.481717e-2 * R * R +
    1.22874e-3 * T * T * R +
    8.5282e-4 * T * R * R -
    1.99e-6 * T * T * R * R;

  // 건조·다습 구간 보정
  if (R < 13 && T >= 80 && T <= 112) {
    hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  } else if (R > 85 && T >= 80 && T <= 87) {
    hi += ((R - 85) / 10) * ((87 - T) / 5);
  }
  return toC(hi);
}

/**
 * 체감온도(바람 냉각) — NWS 2001 개정식(미터법).
 * 기온 10℃ 이하, 풍속 4.8km/h 이상에서만 정의된다.
 * @param tempC 기온(℃), @param windKmh 풍속(km/h)
 * @returns 체감 온도(℃) — 적용 범위를 벗어나면 기온 그대로
 */
export function windChillC(tempC: number, windKmh: number): number {
  if (tempC > 10 || windKmh < 4.8) return tempC;
  const v = Math.pow(windKmh, 0.16);
  return 13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v;
}

export type RiskLevel = "safe" | "caution" | "warning" | "danger";

export type Assessment = {
  /** 체감 온도(℃) */
  feelsLikeC: number;
  level: RiskLevel;
  label: string;
  /** 무엇이 위험한지 */
  headline: string;
  /** 어른 나들이 기준 행동 지침 */
  advice: string[];
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  safe: "무리 없음",
  caution: "주의",
  warning: "경고",
  danger: "위험",
};

/** 여름: 열지수 기준 (NWS 구간을 어른 기준으로 한 단계 보수적으로) */
function assessHeat(feels: number): Omit<Assessment, "feelsLikeC"> {
  if (feels < 27) {
    return {
      level: "safe",
      label: LEVEL_LABEL.safe,
      headline: "야외 활동에 무리가 없는 날씨입니다.",
      advice: [
        "평소대로 활동하되 물은 챙기세요.",
        "한낮에도 그늘에서 쉬어 가면 더 쾌적합니다.",
      ],
    };
  }
  if (feels < 32) {
    return {
      level: "caution",
      label: LEVEL_LABEL.caution,
      headline: "오래 움직이면 피로가 빨리 쌓입니다.",
      advice: [
        "30분에 한 번은 그늘에서 쉬고 물을 마시세요.",
        "모자와 밝은 색 옷이 도움이 됩니다.",
        "가장 더운 오후 2~5시는 피해 일정을 잡으세요.",
      ],
    };
  }
  if (feels < 41) {
    return {
      level: "warning",
      label: LEVEL_LABEL.warning,
      headline: "온열질환이 생길 수 있는 구간입니다.",
      advice: [
        "장시간 야외 활동은 미루는 편이 좋습니다.",
        "굳이 나간다면 오전 이른 시간에 짧게 다녀오세요.",
        "어지럽거나 땀이 멎으면 즉시 그늘로 옮기고 몸을 식히세요.",
        "고혈압·심장질환이 있다면 이 구간부터는 실내 활동을 권합니다.",
      ],
    };
  }
  return {
    level: "danger",
    label: LEVEL_LABEL.danger,
    headline: "열사병 위험이 높습니다. 야외 활동을 피하세요.",
    advice: [
      "파크골프·등산처럼 그늘이 적은 활동은 오늘 하지 마세요.",
      "실내 수영장이나 온천처럼 더위를 피할 수 있는 곳으로 바꾸세요.",
      "의식이 흐려지거나 말이 어눌해지면 즉시 119에 연락하세요.",
    ],
  };
}

/** 겨울: 체감온도 기준 (동상까지 걸리는 시간을 기준으로) */
function assessCold(feels: number): Omit<Assessment, "feelsLikeC"> {
  if (feels > 0) {
    return {
      level: "safe",
      label: LEVEL_LABEL.safe,
      headline: "쌀쌀하지만 활동에 무리는 없습니다.",
      advice: [
        "얇은 옷을 여러 겹 껴입어 체온을 조절하세요.",
        "땀이 식으면 급격히 추워지니 여벌 옷을 챙기세요.",
      ],
    };
  }
  if (feels > -10) {
    return {
      level: "caution",
      label: LEVEL_LABEL.caution,
      headline: "장시간 노출되면 손발이 빠르게 시립니다.",
      advice: [
        "장갑·모자·목도리로 노출 부위를 줄이세요.",
        "산행이라면 능선의 바람을 감안해 한 단계 더 두껍게 입으세요.",
        "따뜻한 물이나 보온병을 챙기면 도움이 됩니다.",
      ],
    };
  }
  if (feels > -25) {
    return {
      level: "warning",
      label: LEVEL_LABEL.warning,
      headline: "노출된 피부에 30분 안팎이면 동상이 올 수 있습니다.",
      advice: [
        "긴 산행은 미루고 짧은 일정으로 바꾸세요.",
        "얼굴과 손끝을 완전히 덮고, 젖은 옷은 즉시 갈아입으세요.",
        "혈압이 높다면 이른 아침 추위 노출은 특히 조심하세요.",
      ],
    };
  }
  return {
    level: "danger",
    label: LEVEL_LABEL.danger,
    headline: "짧은 노출로도 동상 위험이 큽니다. 야외 활동을 피하세요.",
    advice: [
      "산행·파크골프 모두 오늘은 접는 편이 안전합니다.",
      "온천처럼 실내에서 즐길 수 있는 곳으로 바꾸세요.",
    ],
  };
}

export type Season = "summer" | "winter";

/**
 * 계절에 맞는 지표를 골라 평가한다.
 * @param season 여름(열지수) / 겨울(체감온도)
 */
export function assess(
  season: Season,
  tempC: number,
  humidityOrWind: number,
): Assessment {
  if (season === "summer") {
    const feels = heatIndexC(tempC, humidityOrWind);
    return { feelsLikeC: Math.round(feels * 10) / 10, ...assessHeat(feels) };
  }
  const feels = windChillC(tempC, humidityOrWind);
  return { feelsLikeC: Math.round(feels * 10) / 10, ...assessCold(feels) };
}
