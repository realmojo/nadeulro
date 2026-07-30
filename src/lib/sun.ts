/**
 * 좌표 기준 일출·일몰 계산 (NOAA sunrise equation).
 *
 * 산 1,338곳은 좌표가 있으므로 산마다 실제로 다른 일몰 시각을 계산할 수 있다.
 * "일몰이 몇 시인가"는 어른 산행 계획에서 가장 실질적인 정보인데,
 * 공공데이터에도 지도 앱에도 산별로는 없다 → 나들로가 만들 수 있는 고유 정보.
 *
 * 순수 함수(외부 API 없음). 결과는 KST(UTC+9) 기준.
 */

const KST_OFFSET_MIN = 9 * 60;
/** 대기 굴절 + 태양 반지름을 감안한 표준 일출/일몰 고도 */
const ZENITH_DEG = -0.833;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** 자정(UTC) 기준 율리우스일 */
function julianDay(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d) / 86400000 + 2440587.5;
}

export type SunTimes = {
  /** KST 분 단위(0~1439). 백야/극야로 계산 불가하면 null */
  sunriseMin: number | null;
  sunsetMin: number | null;
};

/**
 * 특정 날짜의 일출·일몰 (KST 분 단위).
 * @param lat 위도, @param lng 경도, @param y/m/d 연/월/일
 */
export function sunTimes(
  lat: number,
  lng: number,
  y: number,
  m: number,
  d: number,
): SunTimes {
  const n = Math.round(julianDay(y, m, d) - 2451545.0 + 0.0008);
  const jStar = n - lng / 360;

  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C =
    1.9148 * Math.sin(rad(M)) +
    0.02 * Math.sin(rad(2 * M)) +
    0.0003 * Math.sin(rad(3 * M));
  const lambda = (M + C + 180 + 102.9372) % 360;

  const jTransit =
    2451545.0 +
    jStar +
    0.0053 * Math.sin(rad(M)) -
    0.0069 * Math.sin(rad(2 * lambda));

  const sinDec = Math.sin(rad(lambda)) * Math.sin(rad(23.4397));
  const cosDec = Math.cos(Math.asin(sinDec));

  const cosOmega =
    (Math.sin(rad(ZENITH_DEG)) - Math.sin(rad(lat)) * sinDec) /
    (Math.cos(rad(lat)) * cosDec);

  // |cosω| > 1 → 그날 해가 뜨지 않거나 지지 않음 (한국 위도에서는 발생하지 않음)
  if (cosOmega > 1 || cosOmega < -1) {
    return { sunriseMin: null, sunsetMin: null };
  }

  const omega = deg(Math.acos(cosOmega));
  const jSet = jTransit + omega / 360;
  const jRise = jTransit - omega / 360;

  /** 율리우스일 → 그날 KST 의 분 단위 시각 */
  const toKstMinutes = (j: number): number => {
    const ms = (j - 2440587.5) * 86400000;
    const utcMin = ms / 60000;
    const kst = utcMin + KST_OFFSET_MIN;
    return ((Math.round(kst) % 1440) + 1440) % 1440;
  };

  return { sunriseMin: toKstMinutes(jRise), sunsetMin: toKstMinutes(jSet) };
}

/** 분 → "17:31" */
export function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type MonthlySun = {
  month: number;
  sunrise: string;
  sunset: string;
  /** 하산을 시작해야 하는 권장 시각 (일몰 90분 전) */
  turnBack: string;
};

/** 하산 여유 — 숲은 일몰 전에 먼저 어두워지므로 90분을 둔다 */
export const DESCENT_BUFFER_MIN = 90;

/**
 * 월별 일출·일몰 표 (각 달 15일 기준).
 * 15일은 그 달의 평균에 가장 가깝고, 해마다 차이는 2분 안쪽이라 안정적이다.
 */
export function monthlySun(lat: number, lng: number, year: number): MonthlySun[] {
  const out: MonthlySun[] = [];
  for (let m = 1; m <= 12; m++) {
    const { sunriseMin, sunsetMin } = sunTimes(lat, lng, year, m, 15);
    if (sunriseMin == null || sunsetMin == null) continue;
    out.push({
      month: m,
      sunrise: formatMin(sunriseMin),
      sunset: formatMin(sunsetMin),
      turnBack: formatMin((sunsetMin - DESCENT_BUFFER_MIN + 1440) % 1440),
    });
  }
  return out;
}

/** 낮 길이가 가장 짧은/긴 달 — 표를 요약하는 문장에 쓴다 */
export function daylightExtremes(rows: MonthlySun[]): {
  shortest: MonthlySun;
  longest: MonthlySun;
} | null {
  if (rows.length < 2) return null;
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  const withLen = rows.map((r) => ({
    r,
    len: toMin(r.sunset) - toMin(r.sunrise),
  }));
  withLen.sort((a, b) => a.len - b.len);
  return { shortest: withLen[0].r, longest: withLen[withLen.length - 1].r };
}
