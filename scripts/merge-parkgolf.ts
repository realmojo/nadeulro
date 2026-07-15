/**
 * 시·도별 공공데이터 CSV → 전국 통합 parkgolf.json.
 *
 * 사용 흐름(브리프 6절):
 *  1) 공공데이터포털(data.go.kr)에서 시·도별 파크골프장 CSV를 내려받아
 *     data/parkgolf/raw/ 아래에 둡니다. (예: gyeonggi.csv, seoul.csv ...)
 *  2) 이 스크립트로 통합 + 정규화 → data/parkgolf/parkgolf.json 생성.
 *  3) 좌표(위경도)가 없는 행은 카카오 로컬 API 지오코딩으로 보강(TODO).
 *
 * 실행: pnpm tsx scripts/merge-parkgolf.ts
 * (tsx 미설치 시: pnpm add -D tsx)
 *
 * NOTE: 이 파일은 스캐폴딩 골격입니다. CSV 컬럼명은 데이터셋마다 다르므로
 *       REGION_FILES 와 pickColumn 매핑을 실제 헤더에 맞춰 조정하세요.
 */
import fs from "node:fs";
import path from "node:path";

type ParkGolfCourse = {
  id: string;
  name: string;
  region: string;
  city?: string;
  address: string;
  holes?: number;
  phone?: string;
  fee?: string;
  lat?: number;
  lng?: number;
};

const RAW_DIR = path.join(process.cwd(), "data", "parkgolf", "raw");
const OUT_FILE = path.join(process.cwd(), "data", "parkgolf", "parkgolf.json");

/** 파일명(확장자 제외) → 시·도 표기 매핑. 실제 파일에 맞게 채우세요. */
const REGION_LABEL: Record<string, string> = {
  seoul: "서울특별시",
  gyeonggi: "경기도",
  incheon: "인천광역시",
  gangwon: "강원특별자치도",
  // ... 필요에 따라 추가
};

/** 아주 단순한 CSV 파서(따옴표/콤마 이스케이프 최소 대응). */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter(Boolean);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h.trim()] = (cells[i] ?? "").trim()));
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** 여러 후보 헤더 중 먼저 값이 있는 컬럼을 고른다. */
function pickColumn(row: Record<string, string>, candidates: string[]): string {
  for (const key of candidates) {
    if (row[key]) return row[key];
  }
  return "";
}

function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`원본 폴더가 없습니다: ${RAW_DIR}`);
    console.error("공공데이터 CSV를 data/parkgolf/raw/ 아래에 두세요.");
    process.exit(1);
  }

  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".csv"));
  const all: ParkGolfCourse[] = [];

  for (const file of files) {
    const key = path.basename(file, ".csv");
    const region = REGION_LABEL[key] ?? key;
    const rows = parseCsv(fs.readFileSync(path.join(RAW_DIR, file), "utf-8"));

    rows.forEach((row, idx) => {
      const name = pickColumn(row, ["시설명", "파크골프장명", "명칭", "name"]);
      const address = pickColumn(row, [
        "소재지도로명주소",
        "소재지지번주소",
        "주소",
        "address",
      ]);
      if (!name) return;

      const latStr = pickColumn(row, ["위도", "lat", "latitude"]);
      const lngStr = pickColumn(row, ["경도", "lng", "longitude"]);

      all.push({
        id: `${key}-${String(idx + 1).padStart(4, "0")}`,
        name,
        region,
        city: pickColumn(row, ["시군구명", "시군구", "city"]) || undefined,
        address,
        holes: Number(pickColumn(row, ["홀수", "holes"])) || undefined,
        phone: pickColumn(row, ["전화번호", "연락처", "phone"]) || undefined,
        fee: pickColumn(row, ["이용요금", "요금", "fee"]) || undefined,
        lat: latStr ? Number(latStr) : undefined,
        lng: lngStr ? Number(lngStr) : undefined,
      });
    });
  }

  // TODO: lat/lng 없는 항목 → 카카오 로컬 API 지오코딩으로 보강.
  const missingCoords = all.filter((c) => c.lat == null || c.lng == null).length;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(all, null, 2) + "\n", "utf-8");

  console.log(`통합 완료: ${all.length}곳 → ${OUT_FILE}`);
  if (missingCoords > 0) {
    console.warn(`좌표 없는 항목 ${missingCoords}곳 → 지오코딩 필요.`);
  }
}

main();
