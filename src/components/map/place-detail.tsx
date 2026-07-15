"use client";

import Link from "next/link";
import { ArrowLeft, Award, ExternalLink } from "lucide-react";

import {
  CATEGORIES,
  isTop100,
  placeDetailPath,
  type Place,
} from "@/lib/places";
import { PlaceDetailContent } from "@/components/place/place-detail-content";

/** 지도 화면 공용 상세 카드 (모바일 시트 · PC 패널) */
export function PlaceDetail({
  place,
  onBack,
}: {
  place: Place;
  onBack: () => void;
}) {
  const meta = CATEGORIES[place.category];

  return (
    <div className="flex h-full flex-col">
      {/* 상단: 뒤로 + 카테고리 */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted"
          aria-label="목록으로 돌아가기"
        >
          <ArrowLeft className="size-6" />
        </button>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.label}
        </span>
        {isTop100(place) ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-persimmon/40 bg-persimmon/10 px-3 py-1 text-sm font-semibold text-persimmon">
            <Award className="size-4" />
            100대 명산
          </span>
        ) : null}
      </div>

      {/* 본문 */}
      <div className="panel-scroll flex-1 overflow-y-auto px-5 pb-5 pt-2">
        <PlaceDetailContent place={place} titleAs="h2" />
        <Link
          href={placeDetailPath(place.category, place.name)}
          className="mt-4 inline-flex items-center gap-1.5 text-base font-semibold text-primary hover:underline"
        >
          <ExternalLink className="size-4" />
          상세 페이지 열기
        </Link>
      </div>
    </div>
  );
}
