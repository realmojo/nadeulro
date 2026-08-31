import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileCheck2,
  Info,
  ListChecks,
  MapPin,
  Navigation,
  Phone,
  Route,
} from "lucide-react";

import {
  CATEGORIES,
  isTop100,
  kakaoDirectionsUrl,
  placeDetailPath,
  regionPath,
  reserveLink,
  type Place,
} from "@/lib/places";
import {
  buildFaqs,
  checklist,
  contactNote,
  disclaimer,
  facilityRows,
  tipSection,
  usageIntro,
  usageNotes,
} from "@/lib/place-seo";
import {
  coursePairing,
  formatDistance,
  formatUpdatedAt,
  nearestLines,
  radiusBreakdown,
  radiusSummary,
  rankSentence,
  scarcityNote,
  sourceNote,
  tempNote,
} from "@/lib/place-facts";
import { DESCENT_BUFFER_MIN, daylightExtremes, monthlySun } from "@/lib/sun";
import type { RelatedPlaces } from "@/lib/places-server";
import { AdUnit } from "@/components/ad-unit";
import { adsense } from "@/lib/site";

/**
 * 상세 페이지 본문 — 가이드형 롱폼 아티클(서버 렌더, SEO/AEO 최적화).
 * 사실은 정확히, 없는 정보(운영시간·요금)는 일반 안내로만 표기.
 */
export function PlaceArticle({
  place,
  heading,
  related,
}: {
  place: Place;
  heading: string;
  related: RelatedPlaces;
}) {
  const meta = CATEGORIES[place.category];
  const a = place.attributes;
  const label = meta.label;
  const image = a.image?.replace(/^http:\/\//, "https://");
  const faqs = buildFaqs(place);
  const rows = facilityRows(place);
  const tip = tipSection(place);
  const notes = usageNotes(place);
  const items = checklist(place);
  const contact = contactNote(place);
  const reserve = reserveLink(place);
  const usageTitle =
    place.category === "parkgolf"
      ? "예약 방법 및 이용 안내"
      : place.category === "hiking"
        ? "등산 안내"
        : "이용 안내";
  const hikingParas = (place.description ?? "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // 좌표·공개 수치에서 계산한 값 — 이 페이지에만 있는 정보
  const { radius, rank } = related;
  const breakdown = radius ? radiusBreakdown(radius) : [];
  const nearest = radius ? nearestLines(radius) : [];
  const pairing = radius ? coursePairing(place, radius) : null;
  const temp = tempNote(place);
  const source = sourceNote(place);
  const updatedLabel = formatUpdatedAt(place.updatedAt);
  // 산은 좌표로 일몰을 계산 — 산마다 실제로 다른 값이 나온다
  const sunRows =
    place.category === "hiking" && place.lat != null && place.lng != null
      ? monthlySun(place.lat, place.lng, new Date().getFullYear())
      : [];
  const extremes = daylightExtremes(sunRows);
  // 등산·수목원 본문은 공공기관 원문이라 출처를 밝힌다
  const sourceLabel =
    place.category === "hiking"
      ? { name: "산림청", href: "https://www.forest.go.kr" }
      : place.category === "arboretum"
        ? { name: "한국관광공사", href: "https://knto.or.kr" }
        : null;

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-4 md:py-8">
      {/* 광고: 콘텐츠 최상단 */}
      <AdUnit slot={adsense.slots.top} className="mb-4" />

      {/* 상단 내비 */}
      <div className="flex items-center gap-2">
        <Link
          href={meta.path}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted"
          aria-label={`${label} 목록으로`}
        >
          <ArrowLeft className="size-6" />
        </Link>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {label}
        </span>
        {isTop100(place) ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-persimmon/40 bg-persimmon/10 px-3 py-1 text-sm font-semibold text-persimmon">
            <Award className="size-4" />
            100대 명산
          </span>
        ) : null}
      </div>

      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={`${place.name} 사진`}
          loading="lazy"
          className="mt-4 h-48 w-full rounded-xl object-cover md:h-60"
        />
      ) : null}

      <h1 className="font-display mt-4 text-2xl font-bold leading-snug md:text-3xl">
        {heading}
      </h1>
      {a.subtitle ? (
        <p className="mt-2 break-keep text-lg leading-snug text-foreground/80">
          {a.subtitle}
        </p>
      ) : null}
      {/* 광고: 제목 아래 */}
      <AdUnit slot={adsense.slots.belowTitle} className="mt-4" />

      {/*
        파크골프·온천·수영장의 description 은 "○○에 위치한 수영장입니다" 식
        자동생성 문장이라 바로 아래 시설 정보 표와 내용이 겹친다. 분량만 늘리고
        정보를 더하지 않으므로 본문에는 싣지 않는다.
        수목원 원문(관광공사)은 실제 소개글이므로 아래 '소개' 섹션에서 출처와 함께.
      */}

      {/* 핵심 행동 버튼 */}
      <div className="mt-5 grid gap-3">
        <a
          href={kakaoDirectionsUrl(place)}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-persimmon px-4 text-lg font-bold text-persimmon-foreground shadow-sm transition-transform active:scale-[0.98]"
        >
          <Navigation className="size-5" />
          카카오맵 길찾기
        </a>
        {place.phone || reserve ? (
          <div className="grid grid-cols-2 gap-3">
            {place.phone ? (
              <a
                href={`tel:${place.phone.replace(/[^0-9+]/g, "")}`}
                className="flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 border-primary/25 bg-card px-3 text-base font-semibold text-primary transition-colors hover:bg-accent"
              >
                <Phone className="size-5" />
                전화하기
              </a>
            ) : null}
            {reserve ? (
              <a
                href={reserve}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 border-primary/25 bg-card px-3 text-base font-semibold text-primary transition-colors hover:bg-accent"
              >
                <ExternalLink className="size-5" />
                예약·홈페이지
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* 위치 및 시설 정보 */}
      <Section title="위치 및 시설 정보">
        <dl className="divide-y divide-border rounded-xl border border-border/70 text-base">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3 px-4 py-3">
              <dt className="w-20 shrink-0 text-muted-foreground">{r.label}</dt>
              <dd className="flex-1 break-keep font-medium text-foreground/90">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
        {place.region ? (
          <Link
            href={regionPath(place.category, place.region)}
            className="mt-3 inline-flex items-center gap-1.5 text-base font-semibold text-primary hover:underline"
          >
            <MapPin className="size-4" />
            {place.region} {label} 전체 보기
          </Link>
        ) : null}
      </Section>

      {/* 온천: 수온 숫자만으로는 모르는 가온 여부 */}
      {temp ? (
        <Section title="이 온천의 물">
          <p className="break-keep text-base leading-relaxed text-foreground/85">
            {temp}
          </p>
        </Section>
      ) : null}

      {/* 나들이 반경 — 좌표로 계산한 이 장소만의 정보 */}
      {radius && radius.total > 0 ? (
        <Section title={`반경 ${radius.km}km 나들이 반경`}>
          <p className="break-keep text-base leading-relaxed text-foreground/85">
            {radiusSummary(place, radius)}
          </p>
          <p className="mt-2 break-keep text-base leading-relaxed text-foreground/85">
            {scarcityNote(place, radius)}
          </p>

          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {breakdown.map((b) => (
              <li
                key={b.category}
                className="rounded-xl border border-border/70 bg-card px-3 py-2.5"
              >
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORIES[b.category].color }}
                  />
                  {b.label}
                </span>
                <span className="mt-0.5 block text-xl font-bold tabular-nums">
                  {b.count}
                  <span className="ml-0.5 text-base font-semibold text-foreground/70">
                    곳
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {nearest.length ? (
            <>
              <h3 className="mt-6 flex items-center gap-1.5 text-lg font-bold">
                <Compass className="size-5 text-primary/70" />
                가장 가까운 곳
              </h3>
              <ul className="mt-2 divide-y divide-border rounded-xl border border-border/70">
                {nearest.map((n) => (
                  <li key={n.place.id}>
                    <Link
                      href={placeDetailPath(n.place.category, n.place.slug)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                    >
                      <span className="w-16 shrink-0 text-sm text-muted-foreground">
                        {n.label}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {n.place.name}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {formatDistance(n.km)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {pairing ? (
            <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
                <Route className="size-4" />
                하루 코스로 묶는다면
              </p>
              <p className="mt-1.5 break-keep text-base leading-relaxed text-foreground/85">
                {pairing.sentence}
              </p>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* 지역 내 순위 — 공개 수치가 있는 카테고리만 */}
      {rank ? (
        <Section title="지역 안에서의 규모">
          <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-foreground/80">
              <BarChart3 className="size-4 text-primary/70" />
              {place.region} {label} {rank.total}곳 중 {rank.metric} {rank.position}위
            </p>
            <p className="mt-1.5 break-keep text-base leading-relaxed text-foreground/85">
              {rankSentence(place, rank)}
            </p>
          </div>
        </Section>
      ) : null}

      {/* 등산·수목원: 공공기관 원문 소개 (출처 명시) */}
      {sourceLabel && hikingParas.length ? (
        <Section title={place.category === "hiking" ? "산 소개" : "수목원 소개"}>
          <blockquote className="space-y-4 break-keep border-l-4 border-border pl-4 text-base leading-[1.9] text-foreground/85">
            {hikingParas.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </blockquote>
          <p className="mt-3 text-sm text-muted-foreground">
            위 소개글은{" "}
            <a
              href={sourceLabel.href}
              target="_blank"
              rel="noreferrer nofollow"
              className="font-semibold text-primary hover:underline"
            >
              {sourceLabel.name}
            </a>
            에서 공개한 자료를 인용한 것입니다. 아래 일몰·주변 정보는 나들로가
            좌표를 바탕으로 계산했습니다.
          </p>
          {isTop100(place) ? (
            <div className="mt-4 rounded-xl border border-persimmon/25 bg-persimmon/5 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-persimmon">
                <Award className="size-4" />
                100대 명산 선정 이유
              </p>
              <p className="mt-1.5 whitespace-pre-line break-keep text-base leading-[1.85] text-foreground/85">
                {a.top100_reason}
              </p>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* 등산: 이 산 좌표로 계산한 월별 일몰과 하산 역산 */}
      {sunRows.length && extremes ? (
        <Section title="산행 시간 계획 — 이 산의 일몰 시각">
          <p className="break-keep text-base leading-relaxed text-foreground/85">
            {place.name}의 좌표({place.lat!.toFixed(3)}, {place.lng!.toFixed(3)})
            기준으로 계산한 월별 일출·일몰입니다. 해가 가장 짧은{" "}
            {extremes.shortest.month}월에는 {extremes.shortest.sunset}에,
            가장 긴 {extremes.longest.month}월에는 {extremes.longest.sunset}에
            해가 집니다. 산속은 능선에 해가 가리면 일몰 전부터 어두워지므로,
            아래 &lsquo;하산 시작&rsquo;은 일몰 {DESCENT_BUFFER_MIN}분 전으로
            잡았습니다.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-base">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th scope="col" className="py-2 pr-2 font-medium">
                    월
                  </th>
                  <th scope="col" className="py-2 pr-2 font-medium">
                    일출
                  </th>
                  <th scope="col" className="py-2 pr-2 font-medium">
                    일몰
                  </th>
                  <th scope="col" className="py-2 font-medium text-primary">
                    하산 시작
                  </th>
                </tr>
              </thead>
              <tbody>
                {sunRows.map((r) => (
                  <tr key={r.month} className="border-b border-border/50">
                    <th
                      scope="row"
                      className="py-2 pr-2 text-left font-semibold tabular-nums"
                    >
                      {r.month}월
                    </th>
                    <td className="py-2 pr-2 tabular-nums text-foreground/80">
                      {r.sunrise}
                    </td>
                    <td className="py-2 pr-2 tabular-nums text-foreground/80">
                      {r.sunset}
                    </td>
                    <td className="py-2 font-bold tabular-nums text-primary">
                      {r.turnBack}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 break-keep text-sm leading-relaxed text-muted-foreground">
            각 달 15일 기준으로 계산한 값이며, 같은 달 안에서 며칠 차이는
            몇 분 수준입니다. 실제 체감 일몰은 산의 방향과 골짜기 지형에 따라
            표보다 이를 수 있습니다.
          </p>
        </Section>
      ) : null}

      {/* 이용/예약 안내 */}
      <Section title={usageTitle}>
        <p className="break-keep text-base leading-relaxed text-foreground/85">
          {usageIntro(place)}
        </p>
        <h3 className="mt-4 text-lg font-bold">이용 시 알아둘 점</h3>
        <ul className="mt-2 space-y-2">
          {notes.map((n) => (
            <li key={n} className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary/70" />
              <span className="break-keep text-base leading-relaxed text-foreground/85">
                {n}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 코스/이용 팁 */}
      <Section title={tip.title}>
        <p className="break-keep text-base leading-relaxed text-foreground/85">
          {tip.body}
        </p>
      </Section>

      {/* 방문 전 체크리스트 */}
      <Section title="방문 전 체크리스트">
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((it) => (
            <li
              key={it}
              className="flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5"
            >
              <ListChecks className="mt-0.5 size-5 shrink-0 text-primary/70" />
              <span className="break-keep text-base leading-snug">{it}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 문의 및 연락처 */}
      <Section title="문의 및 찾아가기">
        {place.phone ? (
          <div className="flex flex-wrap items-center gap-3 text-base">
            <a
              href={`tel:${place.phone.replace(/[^0-9+]/g, "")}`}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <Phone className="size-4" />
              {place.phone}
            </a>
            <a
              href={kakaoDirectionsUrl(place)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <Navigation className="size-4" />
              카카오맵 길찾기
            </a>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
              <p className="flex items-center gap-1.5 text-base font-bold text-foreground/90">
                <Info className="size-4 text-primary/70" />
                연락처가 없는 이유
              </p>
              <p className="mt-1.5 break-keep text-base leading-relaxed text-foreground/80">
                {contact.reason}
              </p>
              <p className="mt-3 text-sm font-bold text-foreground/80">
                이렇게 확인하세요
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {contact.guides.map((g) => (
                  <li key={g} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary/60" />
                    <span className="break-keep text-base leading-relaxed text-foreground/80">
                      {g}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <a
              href={kakaoDirectionsUrl(place)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-primary/25 bg-card px-4 font-semibold text-primary transition-colors hover:bg-accent"
            >
              <Navigation className="size-4" />
              카카오맵 길찾기
            </a>
          </>
        )}
      </Section>

      {/* FAQ */}
      {faqs.length ? (
        <Section title="자주 묻는 질문">
          <dl className="space-y-3">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border bg-card p-4">
                <dt className="text-base font-bold">{f.q}</dt>
                <dd className="mt-1.5 break-keep text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      {/* 내부링크: 같은 지역 + 가까운 곳 */}
      {related.sameRegion.length ? (
        <RelatedList
          title={`${place.region} ${label} 더 보기`}
          items={related.sameRegion.map((p) => ({ place: p }))}
          showCat={false}
        />
      ) : null}
      {related.nearby.length ? (
        <RelatedList
          title="가까운 나들이 스팟"
          items={related.nearby}
          showCat
        />
      ) : null}

      {/* 정보 기준 — 출처와 갱신 시점을 밝혀야 이용자가 신뢰 여부를 판단할 수 있다 */}
      <section className="mt-8 rounded-xl border border-border/70 bg-muted/40 p-4">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-foreground/90">
          <FileCheck2 className="size-4 text-primary/70" />
          정보 기준
        </h2>
        <dl className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0">자료 출처</dt>
            <dd className="flex-1 text-foreground/80">
              {source.href ? (
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer nofollow"
                  className="font-semibold text-primary hover:underline"
                >
                  {source.label}
                </a>
              ) : (
                source.label
              )}
            </dd>
          </div>
          {updatedLabel ? (
            <div className="flex gap-2">
              <dt className="w-20 shrink-0">최근 갱신</dt>
              <dd className="flex-1 text-foreground/80">{updatedLabel}</dd>
            </div>
          ) : null}
          <div className="flex gap-2">
            <dt className="w-20 shrink-0">계산 정보</dt>
            <dd className="flex-1 text-foreground/80">
              {place.category === "hiking"
                ? "반경·거리·순위·일몰 시각은"
                : "반경·거리·순위는"}{" "}
              좌표를 바탕으로 나들로가 계산했습니다.
            </dd>
          </div>
        </dl>
        <p className="mt-3 break-keep text-sm leading-relaxed text-muted-foreground">
          {disclaimer(place)}
        </p>
      </section>

      {/* 광고: 본문 하단 */}
      <AdUnit slot={adsense.slots.bottom} className="mt-8" />
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function RelatedList({
  title,
  items,
  showCat,
}: {
  title: string;
  /** km 이 있으면 거리·소요시간을 함께 보여준다 */
  items: Array<{ place: Place; km?: number }>;
  showCat: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map(({ place: p, km }) => {
          const m = CATEGORIES[p.category];
          return (
            <li key={p.id}>
              <Link
                href={placeDetailPath(p.category, p.slug)}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {showCat ? `${m.label} · ` : ""}
                    {km != null
                      ? formatDistance(km)
                      : [p.region, p.city].filter(Boolean).join(" ")}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
