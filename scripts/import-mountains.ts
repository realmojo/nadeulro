/**
 * 산림청 산정보 → nadeulro_places(category='hiking') 적재 스크립트.
 *
 * 데이터 출처: 산림청 산정보 서비스 (data.go.kr 15058662)
 *   실동작 오퍼레이션: trailInfoService/getforeststoryservice (총 1,338개 산)
 *   ※ 데이터셋 제목의 "3,368개"는 이 키로 열리지 않는 별도 오퍼레이션이며,
 *     본 스크립트는 설명·부제·높이·소재지·이미지·100대명산 선정사유까지 담긴
 *     story 오퍼레이션(1,338개)을 적재한다. 산정보 API 는 위경도를 주지 않으므로
 *     카카오 로컬 API(키워드→주소 순)로 lat/lng 를 보강한다.
 *
 * 실행:
 *   npx tsx scripts/import-mountains.ts --dry --limit=5   # DB 미기록, 매핑 미리보기
 *   npx tsx scripts/import-mountains.ts --limit=10         # 소량 실제 적재
 *   npx tsx scripts/import-mountains.ts                    # 전체 적재
 *   npx tsx scripts/import-mountains.ts --no-geocode       # 좌표 보강 생략(빠름)
 *
 * 멱등성: 실행 시 기존 category='hiking' 행을 모두 지우고 다시 삽입한다.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import { createAdminClient } from "../src/lib/supabase";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

// ─── 설정 ──────────────────────────────────────────────────────────────────
const FOREST_ENDPOINT =
  "http://api.forest.go.kr/openapi/service/trailInfoService/getforeststoryservice";
const FOREST_KEY = process.env.DATA_GO_KR_SERVICE_KEY ?? "";
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY ?? "";
const PAGE_SIZE = 100;
const GEOCODE_CONCURRENCY = 4;
const INSERT_BATCH = 200;

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const NO_GEOCODE = args.includes("--no-geocode");
const LIMIT = (() => {
  const a = args.find((x) => x.startsWith("--limit="));
  return a ? Number(a.split("=")[1]) : Infinity;
})();

// ─── 타입 ──────────────────────────────────────────────────────────────────
type ForestItem = {
  mntnid?: string | number;
  mntnnm?: string;
  mntnsbttlinfo?: string;
  mntninfohght?: string | number;
  mntninfopoflc?: string;
  mntninfodtlinfocont?: string;
  mntninfomangrtlno?: string;
  mntninfomngmemnbdnm?: string;
  mntnattchimageseq?: string;
  hndfmsmtnslctnrson?: string;
};

type PlaceRow = {
  category: "hiking";
  name: string;
  region: string | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  reserve_url: null;
  description: string | null;
  attributes: Record<string, unknown>;
  is_published: boolean;
};

// ─── 유틸: HTML 엔티티/태그 정리 ─────────────────────────────────────────────
function codePointToChar(cp: number): string {
  if (cp === 13 || cp === 10) return "\n"; // CR/LF → 줄바꿈
  if (!Number.isFinite(cp) || cp < 32) return " ";
  try {
    return String.fromCodePoint(cp);
  } catch {
    return " ";
  }
}

function decodeEntities(input: string): string {
  let prev = "";
  let cur = input;
  // &amp;amp;nbsp; 처럼 다중 인코딩된 경우가 있어 안정될 때까지 반복(최대 3회).
  for (let i = 0; i < 4 && cur !== prev; i++) {
    prev = cur;
    cur = cur
      // 숫자/16진 엔티티: CR(13)·LF(10) 는 줄바꿈으로, 그 외는 해당 문자로.
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => codePointToChar(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => codePointToChar(parseInt(d, 10)))
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&amp;/gi, "&"); // &amp; 는 마지막에 풀어야 다음 패스에서 재해석된다
  }
  return cur;
}

function cleanText(raw?: string | number): string {
  if (raw == null) return "";
  let s = decodeEntities(String(raw));
  s = s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  return s
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── 유틸: 소재지 → region/city ─────────────────────────────────────────────
const REGION_MAP: [RegExp, string][] = [
  [/^서울/, "서울"],
  [/^부산/, "부산"],
  [/^대구/, "대구"],
  [/^인천/, "인천"],
  [/^광주/, "광주"],
  [/^대전/, "대전"],
  [/^울산/, "울산"],
  [/^세종/, "세종"],
  [/^경기/, "경기"],
  [/^강원/, "강원"],
  [/^충청?북/, "충북"],
  [/^충청?남/, "충남"],
  [/^전라?북/, "전북"],
  [/^전북/, "전북"],
  [/^전라?남/, "전남"],
  [/^경상?북/, "경북"],
  [/^경상?남/, "경남"],
  [/^제주/, "제주"],
];

function parseRegionCity(poflc?: string): {
  region: string | null;
  city: string | null;
} {
  const clean = cleanText(poflc);
  if (!clean) return { region: null, city: null };
  const first = clean.split(/[,·/]/)[0].trim(); // 첫 소재지 세그먼트
  const tokens = first.split(/\s+/);
  let region: string | null = null;
  for (const [re, label] of REGION_MAP) {
    if (re.test(tokens[0] ?? "")) {
      region = label;
      break;
    }
  }
  const city = tokens[1]?.replace(/[,]/g, "") ?? null;
  return { region, city: city || null };
}

// ─── 산림청 API: 전체 페이지 수집 ────────────────────────────────────────────
async function fetchAllMountains(): Promise<ForestItem[]> {
  const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false });
  const out: ForestItem[] = [];
  let pageNo = 1;
  let total = Infinity;

  while (out.length < total) {
    const url = new URL(FOREST_ENDPOINT);
    url.searchParams.set("serviceKey", FOREST_KEY);
    url.searchParams.set("numOfRows", String(PAGE_SIZE));
    url.searchParams.set("pageNo", String(pageNo));

    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`산림청 API HTTP ${res.status} (page ${pageNo})`);
    const xml = await res.text();
    const parsed = parser.parse(xml);

    const code = parsed?.response?.header?.resultCode;
    if (code !== "00" && code !== 0) {
      throw new Error(
        `산림청 API 오류: ${parsed?.response?.header?.resultMsg ?? xml.slice(0, 200)}`,
      );
    }
    total = Number(parsed?.response?.body?.totalCount ?? 0);
    const rawItems = parsed?.response?.body?.items?.item ?? [];
    const items: ForestItem[] = Array.isArray(rawItems) ? rawItems : [rawItems];
    out.push(...items.filter((it) => it && it.mntnnm));

    process.stdout.write(`\r수집 중… ${out.length}/${total}`);
    if (items.length === 0) break;
    pageNo++;
    if (out.length >= LIMIT) break;
  }
  process.stdout.write("\n");
  return LIMIT === Infinity ? out : out.slice(0, LIMIT);
}

// ─── 카카오 지오코딩 ─────────────────────────────────────────────────────────
type Geo = { lat: number; lng: number; method: string };

async function kakaoSearch(
  kind: "keyword" | "address",
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = new URL(`https://dapi.kakao.com/v2/local/search/${kind}.json`);
  url.searchParams.set("query", query);
  url.searchParams.set("size", "1");
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    documents?: { x: string; y: string }[];
  };
  const doc = j.documents?.[0];
  if (!doc) return null;
  const lat = Number(doc.y);
  const lng = Number(doc.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function geocode(name: string, region: string | null, address: string): Promise<Geo | null> {
  // 산은 키워드 검색이 정상(봉우리 POI)을 잘 잡는다 → 지역+산명 → 산명 → 주소 순.
  const attempts: [("keyword" | "address"), string, string][] = [];
  if (region) attempts.push(["keyword", `${region} ${name}`, "kw_region"]);
  attempts.push(["keyword", name, "kw_name"]);
  const firstAddr = address.split(/[,·/]/)[0]?.trim();
  if (firstAddr) attempts.push(["address", firstAddr, "addr"]);

  for (const [kind, query, method] of attempts) {
    try {
      const hit = await kakaoSearch(kind, query);
      if (hit) return { ...hit, method };
    } catch {
      /* 다음 시도 */
    }
  }
  return null;
}

// 간단한 동시성 제한 map.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ─── 매핑 ────────────────────────────────────────────────────────────────────
function toRow(item: ForestItem, geo: Geo | null): PlaceRow {
  const name = cleanText(item.mntnnm);
  const { region, city } = parseRegionCity(item.mntninfopoflc);
  const location = cleanText(item.mntninfopoflc);
  const height = Number(item.mntninfohght);
  const phoneRaw = cleanText(item.mntninfomangrtlno);
  const image = cleanText(item.mntnattchimageseq);
  const top100 = cleanText(item.hndfmsmtnslctnrson);
  const subtitle = cleanText(item.mntnsbttlinfo);
  const dept = cleanText(item.mntninfomngmemnbdnm);

  const attributes: Record<string, unknown> = {
    source: "forest.go.kr",
    source_ref: String(item.mntnid ?? ""),
    dataset: "data.go.kr:15058662",
  };
  if (Number.isFinite(height) && height > 0) attributes.height = height;
  if (subtitle) attributes.subtitle = subtitle;
  if (top100) attributes.top100_reason = top100;
  if (dept) attributes.manage_dept = dept;
  if (location) attributes.location_raw = location;
  // 실제 파일 ID 가 붙은 이미지만 채택(플레이스홀더/빈 atchFileId 제외).
  if (image && /atchFileId=FILE_\w+/.test(image)) attributes.image = image;
  if (geo) attributes.geocode_method = geo.method;

  return {
    category: "hiking",
    name,
    region,
    city,
    address: location || null,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    phone: phoneRaw && /\d/.test(phoneRaw) ? phoneRaw : null,
    reserve_url: null,
    description: cleanText(item.mntninfodtlinfocont) || null,
    attributes,
    is_published: true,
  };
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  if (!FOREST_KEY) throw new Error(".env.local 에 DATA_GO_KR_SERVICE_KEY 가 없습니다.");
  if (!NO_GEOCODE && !KAKAO_KEY)
    throw new Error(".env.local 에 KAKAO_REST_API_KEY 가 없습니다. (--no-geocode 로 생략 가능)");

  console.log(
    `[import-mountains] dry=${DRY} geocode=${!NO_GEOCODE} limit=${LIMIT === Infinity ? "∞" : LIMIT}`,
  );

  const items = await fetchAllMountains();
  console.log(`산림청 산정보 ${items.length}건 수집 완료.`);

  let geos: (Geo | null)[] = items.map(() => null);
  if (!NO_GEOCODE) {
    let done = 0;
    geos = await mapWithConcurrency(items, GEOCODE_CONCURRENCY, async (it) => {
      const { region } = parseRegionCity(it.mntninfopoflc);
      const g = await geocode(cleanText(it.mntnnm), region, cleanText(it.mntninfopoflc));
      done++;
      if (done % 25 === 0 || done === items.length)
        process.stdout.write(`\r지오코딩… ${done}/${items.length}`);
      return g;
    });
    process.stdout.write("\n");
  }

  const rows = items.map((it, i) => toRow(it, geos[i]));
  const withCoords = rows.filter((r) => r.lat != null).length;
  console.log(
    `매핑 완료: ${rows.length}건 (좌표 확보 ${withCoords}건 / 미확보 ${rows.length - withCoords}건)`,
  );

  if (DRY) {
    console.log("\n─── 미리보기(최대 3건) ───");
    console.dir(rows.slice(0, 3), { depth: null });
    console.log("\n--dry 모드: DB 에 기록하지 않았습니다.");
    return;
  }

  const supabase = createAdminClient();

  // 멱등: 기존 hiking 삭제 후 재삽입.
  const { error: delErr } = await supabase
    .from("nadeulro_places")
    .delete()
    .eq("category", "hiking");
  if (delErr) throw new Error(`기존 hiking 삭제 실패: ${delErr.message}`);

  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const batch = rows.slice(i, i + INSERT_BATCH);
    const { error } = await supabase.from("nadeulro_places").insert(batch);
    if (error) throw new Error(`삽입 실패(batch ${i}): ${error.message}`);
    inserted += batch.length;
    process.stdout.write(`\r삽입… ${inserted}/${rows.length}`);
  }
  process.stdout.write("\n");
  console.log(`✅ 완료: nadeulro_places 에 hiking ${inserted}건 적재.`);
}

main().catch((e) => {
  console.error("\n❌ 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});
