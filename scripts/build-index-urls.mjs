/**
 * 네이버/IndexNow 색인 제출용 URL 목록 생성 → naver-indexing/urls.txt
 *
 * 사이트맵(/sitemap.xml)에서 그대로 뽑는다.
 * 색인 정책(isIndexablePlace, 시군구 허브 2종 이상 조건)은 src/app/sitemap.ts
 * 한 곳에만 두고, 이 스크립트는 그 결과를 따라간다 — 두 목록이 어긋나지 않게.
 *
 * 사용:
 *   node scripts/build-index-urls.mjs                  # 배포된 사이트 기준
 *   node scripts/build-index-urls.mjs http://localhost:3999   # 로컬 빌드 기준
 */
import fs from "node:fs";
import path from "node:path";

const base = (process.argv[2] ?? "https://nadeulro.com").replace(/\/$/, "");

const res = await fetch(`${base}/sitemap.xml`, {
  headers: { "user-agent": "nadeulro-index-builder" },
});
if (!res.ok) {
  console.error(`사이트맵을 읽지 못했습니다: ${base}/sitemap.xml (${res.status})`);
  process.exit(1);
}
const xml = await res.text();

const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  // 사이트맵은 XML 이라 & 가 &amp; 로 이스케이프되어 있다
  m[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim(),
);

if (urls.length === 0) {
  console.error("사이트맵에 <loc> 가 없습니다 — 생성 실패로 보고 중단합니다.");
  process.exit(1);
}

// 한글 경로는 기존 파일과 동일하게 원문 그대로 둔다(네이버 제출 이력이 이 형식)
const decoded = urls.map((u) => {
  try {
    return decodeURI(u);
  } catch {
    return u;
  }
});

const unique = [...new Set(decoded)];
const out = path.join(process.cwd(), "naver-indexing", "urls.txt");
fs.writeFileSync(out, unique.join("\n") + "\n", "utf8");

// 구성 요약
const group = (re) => unique.filter((u) => re.test(u)).length;
console.log(`출처: ${base}/sitemap.xml`);
console.log(`  시군구 허브 /near : ${group(/\/near\//)}`);
console.log(`  코스 /course      : ${group(/\/course\//)}`);
console.log(`  블로그 /blog      : ${group(/\/blog\/[^/]+\//)}`);
console.log(`  지역 랜딩         : ${group(/\/region\//)}`);
console.log(`총 ${unique.length}개 → ${out}`);
