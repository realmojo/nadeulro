import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "node:fs";

const readEnv = (p) => Object.fromEntries(
  fs.readFileSync(p, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']+|["']+$/g, "")];
  }));
const env = readEnv(".env.local");
const aws = readEnv("../mindpang/.env");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const REGION = aws.AWS_REGION || "ap-northeast-2";
const BUCKET = "nadeulro-images";
const s3 = new S3Client({ region: REGION, credentials: { accessKeyId: aws.AWS_ACCESS_KEY_ID, secretAccessKey: aws.AWS_SECRET_ACCESS_KEY } });

const FONT = "Apple SD Gothic Neo, AppleGothic, sans-serif";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SAMPLE = process.argv.includes("--sample");

// 카테고리별 검색 키워드 + 부정 필터
const CAT = {
  parkgolf: { label: "파크골프", kw: ["golf course fairway", "golf green grass", "golf course landscape", "golf putting green"], bad: /clip ?art|\bpng\b|illustration|vector|logo|cartoon/i },
  hotspring: { label: "온천", kw: ["hot spring nature", "rotenburo outdoor onsen", "thermal spring steam", "onsen ryokan bath", "hot spring pool mountain"], bad: /clip ?art|\bpng\b|illustration|vector|water ?park|erlebnisbad|slide|aquapark|swimming|indoor pool|clown|map\b|diagram/i },
  swim: { label: "수영장", kw: ["swimming pool water", "indoor swimming pool", "swimming pool lane", "public swimming pool"], bad: /clip ?art|\bpng\b|illustration|vector|fish|sturgeon|interferometry|nebula|galaxy|insect|map\b/i },
  hiking: { label: "등산", kw: ["mountain trail autumn", "mountain hiking path", "forest trail mountain", "mountain ridge trail"], bad: /clip ?art|\bpng\b|illustration|vector|boat|lake tour|aircraft|map\b|bike|biking/i },
};

async function ov(q) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license=cc0,pdm,by&size=large&mature=false&page_size=20`;
  const r = await fetch(url, { headers: { "User-Agent": "nadeulro-blog/1.0" } });
  return r.ok ? (await r.json()).results || [] : [];
}
async function poolFor(cat) {
  const { kw, bad } = CAT[cat];
  const seen = new Set(), out = [];
  for (const q of kw) for (const it of await ov(q)) {
    if (!it.url || seen.has(it.url)) continue;
    if (bad.test((it.title || "") + " " + (it.creator || ""))) continue;
    const w = it.width || 0, h = it.height || 1, r = w / h;
    if (w < 1200 || r < 1.25 || r > 1.9) continue; // 가로형만(파노라마·세로 제외)
    seen.add(it.url);
    out.push({ url: it.url, w, h, license: it.license, creator: it.creator, provider: it.provider, title: it.title });
  }
  out.sort((a, b) => ((b.license === "cc0" || b.license === "pdm") - (a.license === "cc0" || a.license === "pdm")));
  return out;
}
function wrap(t, max) {
  const wd = (s) => [...s].reduce((a, c) => a + (c === " " ? 0.5 : /[가-힣]/.test(c) ? 1 : 0.55), 0);
  const words = t.split(" "), lines = []; let cur = "";
  for (const w of words) { const c = cur ? cur + " " + w : w; if (wd(c) <= max || !cur) cur = c; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur); return lines;
}
async function composite(imgBuf, { title, label, license, creator }) {
  const base = await sharp(imgBuf, { failOn: "none", limitInputPixels: false }).resize(1200, 630, { fit: "cover", position: "attention" }).toBuffer();
  const lines = wrap(title, 13), fs2 = lines.length >= 3 ? 58 : 68, lh = fs2 + 16;
  const startY = 630 - 72 - (lines.length - 1) * lh;
  const titleSvg = lines.map((ln, i) => `<text x="70" y="${Math.round(startY + i * lh)}" font-family="${FONT}" font-size="${fs2}" font-weight="800" fill="#fff">${esc(ln)}</text>`).join("");
  const need = !(license === "cc0" || license === "pdm");
  const credit = need ? `<text x="1130" y="612" text-anchor="end" font-family="${FONT}" font-size="17" fill="#fff" fill-opacity="0.72">© ${esc((creator || "Unknown").slice(0, 26))} · ${esc((license || "").toUpperCase())}</text>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></linearGradient>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.5"/><stop offset="0.32" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#d)"/><rect width="1200" height="630" fill="url(#t)"/>
    <text x="70" y="70" font-family="${FONT}" font-size="27" font-weight="700" fill="#fff" fill-opacity="0.95">나들로 · ${esc(label)}</text>
    ${titleSvg}${credit}</svg>`;
  return sharp(base).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 86 }).toBuffer();
}

// 20편(카테고리 순서대로 5편씩)
const POSTS = [
  ["parkgolf", "parkgolf-first-swing-changed-morning", "첫 스윙이 바꿔놓은 아침"],
  ["parkgolf", "parkgolf-three-person-team-friendship", "3인 1조에서 배운 관계"],
  ["parkgolf", "parkgolf-day-i-stopped-counting-score", "점수를 세지 않게 된 날"],
  ["parkgolf", "parkgolf-empty-course-at-dawn", "이른 아침 빈 구장에서"],
  ["parkgolf", "parkgolf-showing-up-on-losing-days", "지는 날에도 나가는 이유"],
  ["hotspring", "hotspring-where-age-disappears", "탕 안에서는 나이가 지워진다"],
  ["hotspring", "hotspring-solo-trip-lesson", "혼자 떠난 온천에서 배운 것"],
  ["hotspring", "hotspring-body-does-not-lie", "몸은 거짓말을 못한다"],
  ["hotspring", "hotspring-old-couple-in-silence", "말없이 앉은 부부에게서"],
  ["hotspring", "hotspring-slowing-down-in-winter-steam", "겨울 김 속에서 천천히"],
  ["swim", "swim-water-does-not-rush-me", "물은 나를 다그치지 않는다"],
  ["swim", "swim-day-i-first-floated", "쉰에 처음 물에 뜬 날"],
  ["swim", "swim-strangers-in-same-lane", "같은 레인의 낯선 사람들"],
  ["swim", "swim-learning-not-to-hold-breath", "숨을 참지 않는 법"],
  ["swim", "swim-thirty-minutes-of-weightlessness", "무거운 몸이 가벼워지는 30분"],
  ["hiking", "hiking-mountain-taught-me-slow-is-okay", "느려도 괜찮다는 걸 산이 알려줬다"],
  ["hiking", "hiking-day-i-turned-back", "정상 대신 돌아선 날"],
  ["hiking", "hiking-why-i-climb-same-mountain", "같은 산을 백 번 오르는 이유"],
  ["hiking", "hiking-descent-is-harder-than-climb", "오르막보다 내리막이 어렵다"],
  ["hiking", "hiking-alone-but-not-lonely", "혼자 걷다 만난 사람들"],
];

const pools = {};
for (const cat of Object.keys(CAT)) {
  pools[cat] = await poolFor(cat);
  console.log(`[${cat}] 실사 후보 ${pools[cat].length}장`);
}

let ok = 0;
for (const [cat, slug, title] of POSTS) {
  const pick = pools[cat].shift();
  if (!pick) { console.error(`✗ ${slug}: 후보 부족`); continue; }
  const ib = Buffer.from(await (await fetch(pick.url, { headers: { "User-Agent": "nadeulro-blog/1.0" } })).arrayBuffer());
  const jpg = await composite(ib, { title, label: CAT[cat].label, license: pick.license, creator: pick.creator });
  if (SAMPLE) {
    fs.writeFileSync(`sample-${slug}.jpg`, jpg);
    console.log(`· ${slug} [${pick.license} ${pick.provider}] ${(pick.title || "").slice(0, 34)}`);
    continue;
  }
  const key = `blog/${cat}/${slug}.jpg`;
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: jpg, ContentType: "image/jpeg", CacheControl: "public, max-age=31536000" }));
  const cover = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}?v=2`;
  const { error } = await sb.from("nadeulro_blog").update({ cover_image: cover, updated_at: new Date().toISOString() }).eq("slug", slug);
  if (error) { console.error(`✗ ${slug}:`, error.message); continue; }
  ok++;
  console.log(`✓ ${cat}/${slug}  [${pick.license} ${pick.provider}] ${(pick.creator || "-").slice(0, 18)} | ${(pick.title || "").slice(0, 30)}`);
}
if (!SAMPLE) console.log(`\n완료: ${ok}/${POSTS.length}편 실사 썸네일 교체`);
