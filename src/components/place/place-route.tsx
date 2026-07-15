import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award } from "lucide-react";

import {
  CATEGORIES,
  isTop100,
  placeDetailPath,
  placeHeading,
  type PlaceCategory,
} from "@/lib/places";
import { PlaceDetailContent } from "@/components/place/place-detail-content";
import { fetchPlaceByName } from "@/lib/places-server";
import { siteConfig } from "@/lib/site";

type RouteProps = { params: Promise<{ title: string }> };

/** 상세 페이지 메타데이터 (name 기반) */
export async function placeDetailMetadata(
  category: PlaceCategory,
  props: RouteProps,
): Promise<Metadata> {
  const { title } = await props.params;
  const name = decodeURIComponent(title);
  const meta = CATEGORIES[category];

  let place = null;
  try {
    place = await fetchPlaceByName(category, name);
  } catch {
    /* 조회 실패 시 기본 메타로 진행 */
  }
  if (!place) {
    return { title: `${name} — ${meta.label}`, robots: { index: false } };
  }

  const pageTitle = placeHeading(place);
  const description =
    place.attributes.subtitle ||
    place.description?.replace(/\s+/g, " ").slice(0, 120) ||
    `${place.name}(${meta.label})의 위치·연락처·상세 정보. 카카오맵 길찾기로 바로 출발하세요.`;
  const url = `${siteConfig.url}${placeDetailPath(category, place.name)}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${pageTitle} | ${siteConfig.name}`,
      description,
      url,
      images: place.attributes.image
        ? [place.attributes.image.replace(/^http:\/\//, "https://")]
        : undefined,
    },
  };
}

/** 상세 페이지 본문 (4개 카테고리 라우트 공용) */
export async function PlaceDetailRoute({
  category,
  props,
}: {
  category: PlaceCategory;
  props: RouteProps;
}) {
  const { title } = await props.params;
  const name = decodeURIComponent(title);
  const meta = CATEGORIES[category];

  const place = await fetchPlaceByName(category, name);
  if (!place) notFound();

  const url = `${siteConfig.url}${placeDetailPath(category, place.name)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": category === "hiking" ? "TouristAttraction" : "LocalBusiness",
    name: place.name,
    description: place.description ?? place.attributes.subtitle ?? undefined,
    url,
    ...(place.address ? { address: place.address } : {}),
    ...(place.phone ? { telephone: place.phone } : {}),
    ...(place.lat != null && place.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng } }
      : {}),
    ...(place.attributes.image
      ? { image: place.attributes.image.replace(/^http:\/\//, "https://") }
      : {}),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
      {
        "@type": "ListItem",
        position: 2,
        name: meta.label,
        item: `${siteConfig.url}${meta.path}`,
      },
      { "@type": "ListItem", position: 3, name: place.name, item: url },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 md:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* 상단: 목록으로 + 카테고리 배지 */}
      <div className="flex items-center gap-2">
        <Link
          href={meta.path}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted"
          aria-label={`${meta.label} 목록으로`}
        >
          <ArrowLeft className="size-6" />
        </Link>
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

      <div className="mt-3">
        <PlaceDetailContent
          place={place}
          titleAs="h1"
          heading={placeHeading(place)}
        />
      </div>
    </div>
  );
}
