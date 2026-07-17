"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award,
  Building2,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Flag,
  Info,
  MapPin,
  Mountain,
  Navigation,
  Phone,
  Thermometer,
  Waves,
} from "lucide-react";

import {
  isTop100,
  kakaoDirectionsUrl,
  placeDetailPath,
  reserveLink,
  type Place,
} from "@/lib/places";

/** 설명이 이 글자 수를 넘으면 '더보기'로 접는다 */
const DESC_CLAMP = 220;

/**
 * 장소 상세 본문 — 지도 시트(PlaceDetail)와 상세 페이지(/[category]/[title])가
 * 공유하는 프레젠테이션 블록. 바깥 여백/스크롤은 소비하는 쪽에서 감싼다.
 */
export function PlaceDetailContent({
  place,
  titleAs: TitleTag = "h1",
  heading,
}: {
  place: Place;
  /** 이름 제목 태그 — 상세 페이지는 h1, 지도 시트는 h2(중복 h1 방지) */
  titleAs?: "h1" | "h2";
  /** 제목 텍스트 오버라이드(상세 페이지: "지역 시군구 이름 코스 예약 정보") */
  heading?: string;
}) {
  const attr = place.attributes;
  const reserve = reserveLink(place);
  const [copied, setCopied] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const top100 = isTop100(place);
  // http 이미지는 https 사이트에서 mixed-content 로 차단되므로 https 로 승격
  const imageUrl = attr.image?.replace(/^http:\/\//, "https://");
  const hasImage = Boolean(imageUrl) && !imgFailed;
  const description = place.description?.trim() ?? "";
  // 줄바꿈 기준으로 문단 분리(빈 줄·단일 줄바꿈 모두 문단 경계로 취급)
  const paragraphs = description
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const longDesc = description.length > DESC_CLAMP;
  // 접힘 상태: 누적 길이가 DESC_CLAMP 를 넘어서는 문단까지만 보여준다
  let shownParagraphs = paragraphs;
  if (longDesc && !descOpen) {
    const acc: string[] = [];
    let len = 0;
    for (const p of paragraphs) {
      acc.push(p);
      len += p.length;
      if (len >= DESC_CLAMP) break;
    }
    shownParagraphs = acc;
  }

  const locationRaw =
    attr.location_raw && attr.location_raw !== place.address
      ? attr.location_raw
      : null;
  const hasCoords = place.lat != null && place.lng != null;

  const copyAddress = async () => {
    if (!place.address) return;
    try {
      await navigator.clipboard.writeText(place.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* 클립보드 미지원 환경 무시 */
    }
  };

  return (
    <>
      {/* 대표 이미지 (등산) */}
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={`${place.name} 사진`}
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="mb-4 h-44 w-full rounded-xl object-cover md:h-56"
        />
      ) : null}

      <TitleTag className="font-display text-2xl font-bold leading-snug md:text-3xl">
        {heading ?? place.name}
      </TitleTag>

      {/* 부제 (등산) */}
      {attr.subtitle ? (
        <p className="mt-1.5 break-keep text-lg leading-snug text-foreground/80">
          {attr.subtitle}
        </p>
      ) : null}

      {/* 지역·시군구 (제목에 이미 포함된 상세 페이지에선 생략) */}
      {!heading ? (
        <p className="mt-1 text-base text-muted-foreground">
          {[place.region, place.city].filter(Boolean).join(" · ")}
        </p>
      ) : null}

      {/* 핵심 속성 배지 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {place.category === "parkgolf" && attr.holes ? (
          <Badge icon={<Flag className="size-4" />}>{attr.holes}홀</Badge>
        ) : null}
        {place.category === "parkgolf" && attr.manager ? (
          <Badge icon={<Building2 className="size-4" />}>{attr.manager}</Badge>
        ) : null}

        {place.category === "hotspring" && attr.temp && attr.temp !== "-" ? (
          <Badge icon={<Thermometer className="size-4" />}>
            수온 {attr.temp}
          </Badge>
        ) : null}
        {place.category === "hotspring" &&
        attr.composition &&
        attr.composition !== "-" ? (
          <Badge icon={<Waves className="size-4" />}>{attr.composition}</Badge>
        ) : null}
        {place.category === "hotspring" && attr.status && attr.status !== "-" ? (
          <Badge>{attr.status}</Badge>
        ) : null}

        {place.category === "hiking" && attr.height ? (
          <Badge icon={<Mountain className="size-4" />}>
            해발 {attr.height.toLocaleString()}m
          </Badge>
        ) : null}
        {place.category === "hiking" && attr.manage_dept ? (
          <Badge icon={<Building2 className="size-4" />}>{attr.manage_dept}</Badge>
        ) : null}
      </div>

      {/* 설명 본문 — 문단 분리 + 넉넉한 행간으로 가독성 확보 */}
      {description ? (
        <div className="mt-5">
          <div className="space-y-4 break-keep text-base leading-[1.9] text-foreground/85">
            {shownParagraphs.map((para, i) => (
              <p key={i}>
                {para}
                {longDesc &&
                !descOpen &&
                i === shownParagraphs.length - 1 ? (
                  <span className="text-muted-foreground"> …</span>
                ) : null}
              </p>
            ))}
          </div>
          {longDesc ? (
            <button
              type="button"
              onClick={() => setDescOpen((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-base font-semibold text-primary"
              aria-expanded={descOpen}
            >
              {descOpen ? "접기" : "더보기"}
              <ChevronDown
                className={`size-4 transition-transform ${descOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* 100대 명산 선정 사유 */}
      {top100 ? (
        <div className="mt-5 rounded-xl border border-persimmon/25 bg-persimmon/5 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-persimmon">
            <Award className="size-4" />
            100대 명산 선정 이유
          </p>
          <p className="mt-1.5 whitespace-pre-line break-keep text-base leading-[1.85] text-foreground/85">
            {attr.top100_reason}
          </p>
        </div>
      ) : null}

      {/* 주소 */}
      {place.address ? (
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-muted/70 p-4">
          <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <p className="flex-1 break-keep text-base leading-relaxed">
            {place.address}
          </p>
          <button
            type="button"
            onClick={copyAddress}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background"
            aria-label="주소 복사"
          >
            {copied ? (
              <Check className="size-5 text-primary" />
            ) : (
              <Copy className="size-5" />
            )}
          </button>
        </div>
      ) : null}

      {/* 행동 버튼 — 길찾기 : 상세페이지 5:5 */}
      <div className="mt-5 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <a
            href={kakaoDirectionsUrl(place)}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-13 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-persimmon px-2 text-[15px] font-bold text-persimmon-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            <Navigation className="size-5 shrink-0" />
            길찾기
          </a>
          <Link
            href={placeDetailPath(place.category, place.slug)}
            className="flex min-h-13 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-2 text-[15px] font-bold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            <FileText className="size-5 shrink-0" />
            상세보기
          </Link>
        </div>

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

      {place.phone ? (
        <p className="mt-3 text-center text-base text-muted-foreground">
          {place.phone}
        </p>
      ) : null}

      {/* 상세 정보(남은 컬럼 전부) */}
      {locationRaw || hasCoords || attr.source ? (
        <dl className="mt-6 divide-y divide-border rounded-xl border border-border/70 text-base">
          {locationRaw ? (
            <InfoRow
              icon={<MapPin className="size-4" />}
              label="소재지"
              value={locationRaw}
            />
          ) : null}
          {hasCoords ? (
            <InfoRow
              icon={<Navigation className="size-4" />}
              label="좌표"
              value={`${place.lat!.toFixed(5)}, ${place.lng!.toFixed(5)}`}
            />
          ) : null}
          {attr.source ? (
            <InfoRow
              icon={<Info className="size-4" />}
              label="데이터 출처"
              value={[attr.source, attr.dataset].filter(Boolean).join(" · ")}
            />
          ) : null}
        </dl>
      ) : null}

      <p className="mt-6 break-keep rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
        {place.category === "hiking"
          ? "등산로 상황·통제·주차는 계절과 날씨에 따라 달라질 수 있어요. 방문 전 확인하시면 헛걸음이 없습니다."
          : "운영시간·요금은 변동될 수 있어요. 방문 전 전화로 한 번 확인하시면 헛걸음이 없습니다."}
      </p>
    </>
  );
}

function Badge({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-base font-medium">
      {icon}
      {children}
    </span>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="flex-1 break-keep font-medium text-foreground/90">
        {value}
      </dd>
    </div>
  );
}
