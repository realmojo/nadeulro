import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import fs from "node:fs";

const readEnv = (p) => Object.fromEntries(fs.readFileSync(p, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']+|["']+$/g, "")]; }));
const env = readEnv(".env.local"); const aws = readEnv("../mindpang/.env");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const REGION = aws.AWS_REGION || "ap-northeast-2", BUCKET = "nadeulro-images";
const s3 = new S3Client({ region: REGION, credentials: { accessKeyId: aws.AWS_ACCESS_KEY_ID, secretAccessKey: aws.AWS_SECRET_ACCESS_KEY } });
const FONT = "Apple SD Gothic Neo, AppleGothic, sans-serif";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SAMPLE = process.argv.includes("--sample");

async function commons(queries, bad) {
  const seen = new Set(), out = [];
  for (const q of queries) {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1600`;
    const r = await fetch(u, { headers: { "User-Agent": "nadeulro-blog/1.0 (realmojo88@gmail.com)" } });
    const pages = (await r.json())?.query?.pages || {};
    for (const p of Object.values(pages)) {
      const ii = p.imageinfo?.[0]; if (!ii || ii.mime !== "image/jpeg") continue;
      const w = ii.width, h = ii.height, ratio = w / h;
      if (w < 1200 || ratio < 1.2 || ratio > 2.0) continue;
      const title = p.title.replace(/^File:/, "");
      if (bad.test(title)) continue;
      const lic = ii.extmetadata?.LicenseShortName?.value || "";
      if (/BY-SA|ShareAlike|GFDL|BY-ND|NoDeriv|non-?free|fair use/i.test(lic)) continue;
      const artist = (ii.extmetadata?.Artist?.value || "").replace(/<[^>]+>/g, "").trim();
      if (seen.has(title)) continue; seen.add(title);
      out.push({ title, lic, artist, thumb: ii.thumburl });
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return out;
}
function wrap(t, max) { const wd = (s) => [...s].reduce((a, c) => a + (c === " " ? 0.5 : /[가-힣]/.test(c) ? 1 : 0.55), 0); const words = t.split(" "), lines = []; let cur = ""; for (const w of words) { const c = cur ? cur + " " + w : w; if (wd(c) <= max || !cur) cur = c; else { lines.push(cur); cur = w; } } if (cur) lines.push(cur); return lines; }
async function composite(imgBuf, { title, label, license, creator }) {
  const base = await sharp(imgBuf, { failOn: "none", limitInputPixels: false }).resize(1200, 630, { fit: "cover", position: "attention" }).toBuffer();
  const lines = wrap(title, 13), fs2 = lines.length >= 3 ? 58 : 68, lh = fs2 + 16, startY = 630 - 72 - (lines.length - 1) * lh;
  const titleSvg = lines.map((ln, i) => `<text x="70" y="${Math.round(startY + i * lh)}" font-family="${FONT}" font-size="${fs2}" font-weight="800" fill="#fff">${esc(ln)}</text>`).join("");
  const isCC0 = /CC0|public domain/i.test(license);
  const credit = isCC0 ? "" : `<text x="1130" y="612" text-anchor="end" font-family="${FONT}" font-size="17" fill="#fff" fill-opacity="0.72">© ${esc((creator || "Wikimedia").slice(0, 24))} · ${esc(license)}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></linearGradient><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.5"/><stop offset="0.32" stop-color="#000" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="630" fill="url(#d)"/><rect width="1200" height="630" fill="url(#t)"/><text x="70" y="70" font-family="${FONT}" font-size="27" font-weight="700" fill="#fff" fill-opacity="0.95">나들로 · ${esc(label)}</text>${titleSvg}${credit}</svg>`;
  return sharp(base).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 86 }).toBuffer();
}

// 교체 대상 (v=5)
const VERSION = 5;
const FIX = [
  {
    cat: "swim", label: "수영장", slug: "swim-day-i-first-floated", title: "쉰에 처음 물에 뜬 날",
    q: ["swimming pool water surface", "indoor swimming pool water", "swimming pool lanes water", "Schwimmhalle Becken"],
    bad: /clip ?art|\bpng\b|illustration|vector|logo|icon|\bsvg\b|map|diagram|plan|drawing|painting|construction|abandon|ruin|demol|rubble|\bold\b|alte|exterior|facade|fassade|building|ingbert|olympic|competition|diving|water ?polo|portrait|bikini|woman|girl|\bboy\b|\bman\b|child|model|01653/i,
    prefs: ["Swimming pool Paris", "Piscina", "natatorium", "Schwimmhalle", "Swimming pool", "swimming bath"],
  },
  {
    cat: "hiking", label: "등산", slug: "hiking-day-i-turned-back", title: "정상 대신 돌아선 날",
    q: ["misty mountain ridge", "mountain fog trail", "mountain summit clouds", "foggy mountain path"],
    bad: /clip ?art|\bpng\b|illustration|vector|logo|icon|\bsvg\b|map|diagram|plan|drawing|painting|lake tour|boat|aircraft|bike|biking|town|city|building|\bsign\b|street|road sign|portrait/i,
    prefs: ["fog", "mist", "cloud", "ridge", "summit", "trail", "peak"],
  },
];

let ok = 0;
for (const f of FIX) {
  const pool = await commons(f.q, f.bad);
  let pick = null;
  for (const pref of f.prefs) { pick = pool.find((c) => c.title.includes(pref)); if (pick) break; }
  if (!pick) pick = pool[0];
  if (!pick) { console.error(`✗ ${f.slug}: 후보 없음`); continue; }
  const ib = Buffer.from(await (await fetch(pick.thumb, { headers: { "User-Agent": "nadeulro-blog/1.0 (realmojo88@gmail.com)" } })).arrayBuffer());
  const jpg = await composite(ib, { title: f.title, label: f.label, license: pick.lic, creator: pick.artist });
  if (SAMPLE) { fs.writeFileSync(`sample-${f.slug}.jpg`, jpg); console.log(`· ${f.slug}  [${pick.lic}] ${pick.title.slice(0, 46)}`); continue; }
  const key = `blog/${f.cat}/${f.slug}.jpg`;
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: jpg, ContentType: "image/jpeg", CacheControl: "public, max-age=31536000" }));
  const cover = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}?v=${VERSION}`;
  const { error } = await sb.from("nadeulro_blog").update({ cover_image: cover, updated_at: new Date().toISOString() }).eq("slug", f.slug);
  if (error) { console.error(`✗ ${f.slug}:`, error.message); continue; }
  ok++;
  console.log(`✓ ${f.slug}  [${pick.lic}] ${(pick.artist || "-").slice(0, 16)} | ${pick.title.slice(0, 40)}`);
}
if (!SAMPLE) console.log(`\n완료: ${ok}/${FIX.length}건 교체 (v=4)`);
