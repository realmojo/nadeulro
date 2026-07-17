import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CATEGORIES,
  isIndexablePlace,
  placeDetailPath,
  placeHeading,
  type Place,
  type PlaceCategory,
} from "@/lib/places";
import { buildFaqs, faqJsonLd } from "@/lib/place-seo";
import { PlaceArticle } from "@/components/place/place-article";
import {
  fetchPlaceByName,
  fetchPlaceBySlug,
  fetchRelated,
} from "@/lib/places-server";
import { siteConfig } from "@/lib/site";

/** slug 로 먼저 조회, 없으면 구 URL(이름/%20) 호환을 위해 이름으로도 조회 */
async function resolvePlace(category: PlaceCategory, param: string) {
  const key = decodeURIComponent(param);
  return (
    (await fetchPlaceBySlug(category, key)) ??
    (await fetchPlaceByName(category, key))
  );
}

/** schema.org @type — 카테고리별 세분화 */
const SCHEMA_TYPE: Record<PlaceCategory, string> = {
  parkgolf: "SportsActivityLocation",
  swim: "SportsActivityLocation",
  hotspring: "DaySpa",
  hiking: "TouristAttraction",
};

/** PostalAddress 구조화 */
function postalAddress(p: Place) {
  return {
    "@type": "PostalAddress",
    ...(p.address ? { streetAddress: p.address } : {}),
    ...(p.region ? { addressRegion: p.region } : {}),
    ...(p.city ? { addressLocality: p.city } : {}),
    addressCountry: "KR",
  };
}

type RouteProps = { params: Promise<{ title: string }> };

/** 상세 페이지 메타데이터 (name 기반) */
export async function placeDetailMetadata(
  category: PlaceCategory,
  props: RouteProps,
): Promise<Metadata> {
  const { title } = await props.params;
  const meta = CATEGORIES[category];

  let place = null;
  try {
    place = await resolvePlace(category, title);
  } catch {
    /* 조회 실패 시 기본 메타로 진행 */
  }
  if (!place) {
    return {
      title: `${decodeURIComponent(title)} — ${meta.label}`,
      robots: { index: false },
    };
  }

  const pageTitle = placeHeading(place);
  const description =
    place.attributes.subtitle ||
    place.description?.replace(/\s+/g, " ").slice(0, 120) ||
    `${place.name}(${meta.label})의 위치·연락처·상세 정보. 카카오맵 길찾기로 바로 출발하세요.`;
  const url = `${siteConfig.url}${placeDetailPath(category, place.slug)}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: url },
    // 연락처 없는 시설 페이지는 색인 제외(품질 관리) — 링크는 따라감
    ...(isIndexablePlace(place) ? {} : { robots: { index: false, follow: true } }),
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
  const meta = CATEGORIES[category];

  const place = await resolvePlace(category, title);
  if (!place) notFound();

  let related = { sameRegion: [] as Place[], nearby: [] as Place[] };
  try {
    related = await fetchRelated(place);
  } catch {
    /* 관련 조회 실패해도 본문은 렌더 */
  }

  const url = `${siteConfig.url}${placeDetailPath(category, place.slug)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[category],
    name: place.name,
    description: place.description ?? place.attributes.subtitle ?? undefined,
    url,
    ...(place.address ? { address: postalAddress(place) } : {}),
    ...(place.phone ? { telephone: place.phone } : {}),
    ...(place.lat != null && place.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng } }
      : {}),
    ...(place.attributes.image
      ? { image: place.attributes.image.replace(/^http:\/\//, "https://") }
      : {}),
  };

  const faqs = buildFaqs(place);

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {faqs.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
        />
      ) : null}

      <PlaceArticle
        place={place}
        heading={placeHeading(place)}
        related={related}
      />
    </>
  );
}
