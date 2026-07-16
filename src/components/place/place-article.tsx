import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ExternalLink,
  ListChecks,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";

import {
  CATEGORIES,
  isTop100,
  kakaoDirectionsUrl,
  placeDetailPath,
  regionPath,
  type Place,
} from "@/lib/places";
import {
  buildFaqs,
  checklist,
  closing,
  disclaimer,
  facilityRows,
  tipSection,
  usageIntro,
  usageNotes,
} from "@/lib/place-seo";
import type { RelatedPlaces } from "@/lib/places-server";

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

  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-4 md:py-8">
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
      {place.category !== "hiking" && place.description ? (
        <p className="mt-3 break-keep text-lg leading-relaxed text-foreground/85">
          {place.description}
        </p>
      ) : null}

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
        {place.phone || place.reserveUrl ? (
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
            {place.reserveUrl ? (
              <a
                href={place.reserveUrl}
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

      {/* 등산: 산 소개(원문) */}
      {place.category === "hiking" && hikingParas.length ? (
        <Section title="산 소개">
          <div className="space-y-4 break-keep text-base leading-[1.9] text-foreground/85">
            {hikingParas.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
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
        <div className="flex flex-wrap items-center gap-3 text-base">
          {place.phone ? (
            <a
              href={`tel:${place.phone.replace(/[^0-9+]/g, "")}`}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <Phone className="size-4" />
              {place.phone}
            </a>
          ) : (
            <span className="text-muted-foreground">
              별도 대표번호가 확인되지 않았습니다. 지자체·시설에 문의해 주세요.
            </span>
          )}
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

      {/* 마치며 */}
      <Section title="마치며">
        <p className="break-keep text-base leading-relaxed text-foreground/85">
          {closing(place)}
        </p>
      </Section>

      {/* 내부링크: 같은 지역 + 가까운 곳 */}
      {related.sameRegion.length ? (
        <RelatedList
          title={`${place.region} ${label} 더 보기`}
          places={related.sameRegion}
          showCat={false}
        />
      ) : null}
      {related.nearby.length ? (
        <RelatedList
          title="가까운 나들이 스팟"
          places={related.nearby}
          showCat
        />
      ) : null}

      <p className="mt-8 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
        {disclaimer(place)}
      </p>
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
  places,
  showCat,
}: {
  title: string;
  places: Place[];
  showCat: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {places.map((p) => {
          const m = CATEGORIES[p.category];
          return (
            <li key={p.id}>
              <Link
                href={placeDetailPath(p.category, p.name)}
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
                    {[p.region, p.city].filter(Boolean).join(" ")}
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
