/**
 * 한국관광공사 TourAPI(국문 관광정보) → nadeulro_places(category='arboretum') 적재.
 *
 * 데이터 출처: 한국관광공사_국문 관광정보 서비스_GW (data.go.kr B551011, KorService2)
 *   - areaBasedList2: 분류 cat3=A01010700 ("수목원/정원") 전량 (~96)
 *   - searchKeyword2: 키워드 '수목원'(~63)·'식물원'(~32) — cat3 미부여 항목 보완
 *   → contentid 로 합집합 dedup. detailCommon2 로 개요(overview)·홈페이지 보강.
 *   TourAPI 는 좌표(mapx=lng, mapy=lat)·대표이미지를 내장하므로 별도 지오코딩 불필요.
 *
 * 실행:
 *   npx tsx scripts/import-arboretums.ts --dry --limit=5   # DB 미기록, 매핑 미리보기
 *   npx tsx scripts/import-arboretums.ts --limit=10         # 소량 실제 적재
 *   npx tsx scripts/import-arboretums.ts                    # 전체 적재
 *   npx tsx scripts/import-arboretums.ts --no-detail        # 개요 보강 생략(빠름)
 *
 * 멱등성: 실행 시 기존 category='arboretum' 행을 모두 지우고 다시 삽입한다.
 * 선행조건: nadeulro_places_category_check 제약에 'arboretum' 이 포함돼 있어야 한다
 *   (마이그레이션 add_arboretum_category).
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { createAdminClient } from "../src/lib/supabase";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

// ─── 설정 ──────────────────────────────────────────────────────────────────
const BASE = "https://apis.data.go.kr/B551011/KorService2";
const KEY = process.env.DATA_GO_KR_SERVICE_KEY ?? "";
const PAGE_SIZE = 100;
const DETAIL_CONCURRENCY = 4;
const INSERT_BATCH = 200;
const CAT3_ARBORETUM = "A01010700"; // 자연 > 자연관광지 > 수목원/정원

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const NO_DETAIL = args.includes("--no-detail");
const LIMIT = (() => {
  const a = args.find((x) => x.startsWith("--limit="));
  return a ? Number(a.split("=")[1]) : Infinity;
})();

// ─── 타입 ──────────────────────────────────────────────────────────────────
type TourItem = {
  contentid?: string | number;
  contenttypeid?: string | number;
  title?: string;
  addr1?: string;
  addr2?: string;
  mapx?: string | number; // 경도(lng)
  mapy?: string | number; // 위도(lat)
  firstimage?: string;
  firstimage2?: string;
  tel?: string;
  cat3?: string;
  areacode?: string | number;
};

type Detail = { overview?: string; homepage?: string };

type PlaceRow = {
  category: "arboretum";
  name: string;
  slug: string;
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

// ─── 유틸: HTML/공백 정리 ────────────────────────────────────────────────────
function clean(raw?: string | number): string {
  if (raw == null) return "";
  return String(raw)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** homepage 필드는 보통 <a href="...">...</a> 형태 → href 추출 */
function extractUrl(raw?: string): string | null {
  if (!raw) return null;
  const href = raw.match(/href=["']([^"']+)["']/i)?.[1];
  const url = (href ?? clean(raw)).trim();
  if (!/^https?:\/\//i.test(url)) return null;
  return url.replace(/^http:\/\//i, "https://");
}

function upgradeImg(url?: string): string | null {
  const u = clean(url);
  if (!u || !/^https?:\/\//i.test(u)) return null;
  return u.replace(/^http:\/\//i, "https://");
}

/** 이름 → URL 슬러그(한글 유지, 공백·구두점 → 대시). (category,slug) 유니크 대비. */
function slugify(name: string): string {
  return name
    .normalize("NFC")
    .trim()
    .replace(/[()[\]{}<>·，,./\\'"!?%#&:;|`~*+=@^]+/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── 유틸: 주소 → region/city ────────────────────────────────────────────────
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
  [/^충청?북|^충북/, "충북"],
  [/^충청?남|^충남/, "충남"],
  [/^전라?북|^전북/, "전북"],
  [/^전라?남|^전남/, "전남"],
  [/^경상?북|^경북/, "경북"],
  [/^경상?남|^경남/, "경남"],
  [/^제주/, "제주"],
];

function parseRegionCity(addr?: string): { region: string | null; city: string | null } {
  const s = clean(addr);
  if (!s) return { region: null, city: null };
  const tokens = s.split(/\s+/);
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

// ─── TourAPI 호출 ────────────────────────────────────────────────────────────
function buildUrl(op: string, params: Record<string, string>): URL {
  const url = new URL(`${BASE}/${op}`);
  url.searchParams.set("serviceKey", KEY);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", "nadeulro");
  url.searchParams.set("_type", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url;
}

async function callTour(op: string, params: Record<string, string>): Promise<any> {
  const res = await fetch(buildUrl(op, params), { signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  if (!text.trimStart().startsWith("{")) {
    throw new Error(`TourAPI ${op} 비정상 응답(HTTP ${res.status}): ${text.replace(/\s+/g, " ").slice(0, 120)}`);
  }
  const json = JSON.parse(text);
  const header = json?.response?.header;
  if (header?.resultCode && header.resultCode !== "0000") {
    throw new Error(`TourAPI ${op} 오류 ${header.resultCode}: ${header.resultMsg}`);
  }
  return json?.response?.body;
}

/** 페이지네이션 수집(공통) */
async function collect(op: string, params: Record<string, string>): Promise<TourItem[]> {
  const out: TourItem[] = [];
  let pageNo = 1;
  let total = Infinity;
  while (out.length < total) {
    const body = await callTour(op, { ...params, numOfRows: String(PAGE_SIZE), pageNo: String(pageNo) });
    total = Number(body?.totalCount ?? 0);
    const raw = body?.items?.item ?? [];
    const items: TourItem[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    out.push(...items.filter((it) => it && it.title));
    if (items.length === 0) break;
    pageNo++;
    // 관광지(contentTypeId=12) 만 다뤄 페이지가 많지 않다. 안전 상한.
    if (pageNo > 30) break;
  }
  return out;
}

async function detailCommon(contentId: string): Promise<Detail> {
  try {
    const body = await callTour("detailCommon2", { contentId });
    const raw = body?.items?.item ?? [];
    const item = Array.isArray(raw) ? raw[0] : raw;
    return {
      overview: clean(item?.overview) || undefined,
      homepage: extractUrl(item?.homepage) || undefined,
    };
  } catch {
    return {};
  }
}

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
function toRow(item: TourItem, detail: Detail, slug: string): PlaceRow {
  const name = clean(item.title);
  const address = [clean(item.addr1), clean(item.addr2)].filter(Boolean).join(" ").trim();
  const { region, city } = parseRegionCity(item.addr1);
  const lat = Number(item.mapy);
  const lng = Number(item.mapx);
  const phone = clean(item.tel);
  const image = upgradeImg(item.firstimage) ?? upgradeImg(item.firstimage2);

  const attributes: Record<string, unknown> = {
    source: "visitkorea",
    source_ref: String(item.contentid ?? ""),
    dataset: "data.go.kr:B551011(KorService2)",
  };
  if (image) attributes.image = image;
  if (item.cat3) attributes.cat3 = String(item.cat3);
  if (item.areacode) attributes.areacode = String(item.areacode);
  if (detail.homepage) attributes.homepage = detail.homepage;

  return {
    category: "arboretum",
    name,
    slug,
    region,
    city,
    address: address || null,
    lat: Number.isFinite(lat) && lat !== 0 ? lat : null,
    lng: Number.isFinite(lng) && lng !== 0 ? lng : null,
    phone: phone && /\d/.test(phone) ? phone : null,
    reserve_url: null,
    description: detail.overview ?? null,
    attributes,
    is_published: true,
  };
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  if (!KEY) throw new Error(".env.local 에 DATA_GO_KR_SERVICE_KEY 가 없습니다.");
  console.log(
    `[import-arboretums] dry=${DRY} detail=${!NO_DETAIL} limit=${LIMIT === Infinity ? "∞" : LIMIT}`,
  );

  // 1) 세 소스 수집 후 contentid 로 합집합 dedup.
  const [byCat, byArbor, byPlant] = await Promise.all([
    collect("areaBasedList2", { contentTypeId: "12", cat1: "A01", cat2: "A0101", cat3: CAT3_ARBORETUM }),
    collect("searchKeyword2", { contentTypeId: "12", keyword: "수목원" }),
    collect("searchKeyword2", { contentTypeId: "12", keyword: "식물원" }),
  ]);
  console.log(`수집: cat3=${byCat.length}, 키워드'수목원'=${byArbor.length}, 키워드'식물원'=${byPlant.length}`);

  const map = new Map<string, TourItem>();
  for (const it of [...byCat, ...byArbor, ...byPlant]) {
    const id = String(it.contentid ?? "");
    if (!id) continue;
    if (!map.has(id)) map.set(id, it);
  }
  let merged = [...map.values()];
  console.log(`합집합 dedup: ${merged.length}건`);
  if (LIMIT !== Infinity) merged = merged.slice(0, LIMIT);

  // 2) 상세 개요·홈페이지 보강.
  let details: Detail[] = merged.map(() => ({}));
  if (!NO_DETAIL) {
    let done = 0;
    details = await mapWithConcurrency(merged, DETAIL_CONCURRENCY, async (it) => {
      const d = await detailCommon(String(it.contentid ?? ""));
      done++;
      if (done % 20 === 0 || done === merged.length)
        process.stdout.write(`\r개요 보강… ${done}/${merged.length}`);
      return d;
    });
    process.stdout.write("\n");
  }

  // slug 생성: (category='arboretum', slug) 유니크 → 배치 내 중복은 -2, -3… 접미사.
  const slugSeen = new Map<string, number>();
  const rows = merged.map((it, i) => {
    const base = slugify(clean(it.title)) || `arboretum-${it.contentid ?? i}`;
    const n = (slugSeen.get(base) ?? 0) + 1;
    slugSeen.set(base, n);
    const slug = n === 1 ? base : `${base}-${n}`;
    return toRow(it, details[i], slug);
  });
  const withCoords = rows.filter((r) => r.lat != null).length;
  const withImg = rows.filter((r) => r.attributes.image).length;
  const withDesc = rows.filter((r) => r.description).length;
  console.log(
    `매핑 완료: ${rows.length}건 (좌표 ${withCoords} / 이미지 ${withImg} / 개요 ${withDesc})`,
  );

  if (DRY) {
    console.log("\n─── 미리보기(최대 3건) ───");
    console.dir(rows.slice(0, 3), { depth: null });
    console.log("\n--dry 모드: DB 에 기록하지 않았습니다.");
    return;
  }

  const supabase = createAdminClient();
  const { error: delErr } = await supabase
    .from("nadeulro_places")
    .delete()
    .eq("category", "arboretum");
  if (delErr) throw new Error(`기존 arboretum 삭제 실패: ${delErr.message}`);

  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const batch = rows.slice(i, i + INSERT_BATCH);
    const { error } = await supabase.from("nadeulro_places").insert(batch);
    if (error) throw new Error(`삽입 실패(batch ${i}): ${error.message}`);
    inserted += batch.length;
    process.stdout.write(`\r삽입… ${inserted}/${rows.length}`);
  }
  process.stdout.write("\n");
  console.log(`✅ 완료: nadeulro_places 에 arboretum ${inserted}건 적재.`);
}

main().catch((e) => {
  console.error("\n❌ 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});
