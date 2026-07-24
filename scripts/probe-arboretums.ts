/**
 * 수목원·식물원 데이터 탐침(dry-run) — 적재 전 소스 검증용.
 *
 * 목적:
 *   1) DATA_GO_KR_SERVICE_KEY 가 한국관광공사 TourAPI(국문 관광정보)에 열리는지 확인
 *   2) "수목원"·"식물원" 이 몇 건이나 오고, 어떤 필드(좌표/이미지/주소/개요)를 주는지 확인
 *
 * DB 에 아무것도 쓰지 않는다. 콘솔 출력만.
 *
 * 실행: npx tsx scripts/probe-arboretums.ts
 *
 * 참고: TourAPI 는 서비스별 활용신청이 별도다. 산정보(15058662)가 승인돼 있어도
 *   관광정보 서비스는 별도 신청이 필요할 수 있다. 인증 실패 시 그 사실을 명확히 출력한다.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const KEY = process.env.DATA_GO_KR_SERVICE_KEY ?? "";
// TourAPI 4.0(KorService2). KorService1 은 구버전으로 순차 폐지 중.
const BASE = "http://apis.data.go.kr/B551011/KorService2";

type TourItem = {
  title?: string;
  addr1?: string;
  mapx?: string; // 경도(lng)
  mapy?: string; // 위도(lat)
  firstimage?: string;
  firstimage2?: string;
  tel?: string;
  contentid?: string;
  contenttypeid?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  areacode?: string;
};

async function callTour(
  op: string,
  params: Record<string, string>,
): Promise<{ ok: boolean; total: number; items: TourItem[]; note: string }> {
  const url = new URL(`${BASE}/${op}`);
  url.searchParams.set("serviceKey", KEY);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", "nadeulro");
  url.searchParams.set("_type", "json");
  url.searchParams.set("numOfRows", "5");
  url.searchParams.set("pageNo", "1");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  const text = await res.text();

  // 인증 실패/미신청은 보통 XML(OpenAPI fault)로 온다.
  if (text.trimStart().startsWith("<")) {
    const msg =
      text.match(/<returnAuthMsg>([^<]+)<\/returnAuthMsg>/)?.[1] ??
      text.match(/<errMsg>([^<]+)<\/errMsg>/)?.[1] ??
      text.match(/<cmmMsgHeader>[\s\S]*?<returnReasonCode>([^<]+)</)?.[1] ??
      text.slice(0, 160);
    return { ok: false, total: 0, items: [], note: `XML 응답(비정상): ${msg}` };
  }

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, total: 0, items: [], note: `JSON 파싱 실패: ${text.slice(0, 160)}` };
  }

  const header = json?.response?.header;
  if (header?.resultCode && header.resultCode !== "0000") {
    return { ok: false, total: 0, items: [], note: `API 오류 ${header.resultCode}: ${header.resultMsg}` };
  }

  const body = json?.response?.body;
  const total = Number(body?.totalCount ?? 0);
  const raw = body?.items?.item ?? [];
  const items: TourItem[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return { ok: true, total, items, note: "정상" };
}

function summarizeItem(it: TourItem): string {
  const hasCoord = it.mapx && it.mapy ? "✅" : "❌";
  const hasImg = it.firstimage ? "✅" : "❌";
  return [
    `  • ${it.title ?? "(제목없음)"}`,
    `      주소: ${it.addr1 ?? "-"}`,
    `      좌표: ${hasCoord} (mapy/lat=${it.mapy ?? "-"}, mapx/lng=${it.mapx ?? "-"})`,
    `      이미지: ${hasImg} ${it.firstimage ? it.firstimage.slice(0, 60) : ""}`,
    `      cat3=${it.cat3 ?? "-"} contentid=${it.contentid ?? "-"}`,
  ].join("\n");
}

async function probe(label: string, op: string, params: Record<string, string>) {
  console.log(`\n═══ ${label} ═══`);
  console.log(`  op=${op} params=${JSON.stringify(params)}`);
  try {
    const r = await callTour(op, params);
    if (!r.ok) {
      console.log(`  ⚠️  ${r.note}`);
      return;
    }
    console.log(`  총 ${r.total}건 (샘플 ${r.items.length}건):`);
    for (const it of r.items) console.log(summarizeItem(it));
  } catch (e) {
    console.log(`  ❌ 요청 실패: ${e instanceof Error ? e.message : e}`);
  }
}

async function main() {
  if (!KEY) throw new Error(".env.local 에 DATA_GO_KR_SERVICE_KEY 가 없습니다.");
  console.log(`[probe-arboretums] TourAPI 탐침 시작 (base=${BASE})`);

  // 1) 키워드 검색: 가장 견고. 수목원/식물원 각각.
  await probe("키워드 '수목원' (관광지)", "searchKeyword2", {
    keyword: "수목원",
    contentTypeId: "12",
  });
  await probe("키워드 '식물원' (관광지)", "searchKeyword2", {
    keyword: "식물원",
    contentTypeId: "12",
  });

  // 2) 분류코드 기반: 자연 > 자연관광지 > 수목원(A01011900). 코드 유효성 검증용.
  await probe("분류 cat3=A01011900(수목원)", "areaBasedList2", {
    contentTypeId: "12",
    cat1: "A01",
    cat2: "A0101",
    cat3: "A01011900",
  });

  console.log(
    "\n요약: 위에서 '정상'으로 총건수·좌표✅·이미지✅ 가 보이면 TourAPI 단독으로 적재 가능합니다.\n" +
      "인증이 XML로 막히면 data.go.kr 에서 '한국관광공사 국문 관광정보 서비스' 활용신청이 필요합니다.",
  );
}

main().catch((e) => {
  console.error("\n❌ 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});
