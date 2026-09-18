import type { Metadata } from "next";

import { ThemeListPage } from "@/components/place/theme-page";
import { fetchPlaces } from "@/lib/places-server";
import type { Place } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

const MAX_HEIGHT = 400;

export const metadata: Metadata = {
  title: "초보 등산 — 해발 400m 이하 낮은 산",
  description:
    "처음 오르기 좋은 해발 400m 이하 전국 낮은 산을 지역별로 정리했습니다. 높이와 소개를 확인하고 가벼운 산행부터 시작해 보세요.",
  alternates: { canonical: `${siteConfig.url}/hiking-easy` },
};

export default async function HikingEasyPage() {
  let list: Place[] = [];
  try {
    const { places } = await fetchPlaces();
    list = places.filter(
      (p) =>
        p.category === "hiking" &&
        typeof p.attributes.height === "number" &&
        p.attributes.height > 0 &&
        p.attributes.height <= MAX_HEIGHT,
    );
    list.sort((a, b) => (a.attributes.height ?? 0) - (b.attributes.height ?? 0));
  } catch {
    /* 조회 실패해도 페이지는 뜬다 */
  }

  return (
    <ThemeListPage
      category="hiking"
      title="처음 오르기 좋은 낮은 산"
      description={`해발 ${MAX_HEIGHT}m 이하 — 가볍게 시작하는 전국 낮은 산 모음.`}
      intro={
        <>
          <p>
            해발{" "}
            <b className="font-bold text-foreground">{MAX_HEIGHT}m 이하</b>의
            전국 낮은 산{" "}
            <b className="font-bold text-foreground">{list.length.toLocaleString()}곳</b>
            입니다. 등산을 처음 시작하거나 가볍게 몸을 풀고 싶은 날, 부담 없이
            오르내릴 수 있는 산부터 골라보세요.
          </p>
          <p>
            낮은 순으로 정렬했습니다. 낮은 산도 해가 지면 길이 어두워지니, 각 산
            상세페이지의{" "}
            <b className="font-semibold text-foreground">월별 일몰·하산 시각</b>
            을 확인하고 출발하면 안전합니다.
          </p>
        </>
      }
      list={list}
      badge={(p) =>
        p.attributes.height ? `해발 ${p.attributes.height.toLocaleString()}m` : null
      }
      related={[
        { href: "/mountains-100", label: "산림청 100대 명산" },
        { href: "/autumn", label: "가을 단풍 산행 특집" },
        { href: "/hiking", label: "전국 등산 지도" },
      ]}
    />
  );
}
