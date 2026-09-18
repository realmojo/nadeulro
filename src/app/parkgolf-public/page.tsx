import type { Metadata } from "next";

import { ThemeListPage } from "@/components/place/theme-page";
import { fetchPlaces } from "@/lib/places-server";
import type { Place } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "공공 운영 파크골프장 — 지자체·공단·체육회",
  description:
    "지자체·시설관리공단·체육회가 운영하는 전국 공공 파크골프장을 지역별로 정리했습니다. 대부분 무료이거나 소액으로 이용할 수 있습니다.",
  alternates: { canonical: `${siteConfig.url}/parkgolf-public` },
};

/** 운영 주체 문자열에 공공기관 표기가 들어간 구장만 */
const PUBLIC_HINT = /(시청|군청|구청|공단|공사|체육회|재단|시설관리|지자체|도청|읍|면사무소)/;

function isPublic(p: Place): boolean {
  const m = p.attributes.manager ?? "";
  return PUBLIC_HINT.test(m);
}

function holesOf(p: Place): number {
  const h = Number(p.attributes.holes);
  return Number.isFinite(h) ? h : 0;
}

export default async function ParkgolfPublicPage() {
  let list: Place[] = [];
  try {
    const { places } = await fetchPlaces();
    list = places.filter((p) => p.category === "parkgolf" && isPublic(p));
    list.sort((a, b) => holesOf(b) - holesOf(a));
  } catch {
    /* 조회 실패해도 페이지는 뜬다 */
  }

  return (
    <ThemeListPage
      category="parkgolf"
      title="공공 운영 파크골프장"
      description="지자체·공단·체육회가 운영하는 구장 — 대부분 무료이거나 소액."
      intro={
        <>
          <p>
            운영 주체가{" "}
            <b className="font-bold text-foreground">
              지자체·시설관리공단·체육회 등 공공기관
            </b>
            으로 확인되는 전국 파크골프장{" "}
            <b className="font-bold text-foreground">{list.length.toLocaleString()}곳</b>
            입니다. 공공 구장은 대부분 무료이거나 소액이라 처음 시작하기에
            좋습니다.
          </p>
          <p>
            이용 요금과 예약 방식은 구장마다 다르니, 상세페이지의{" "}
            <b className="font-semibold text-foreground">운영기관·연락처</b>를
            확인하고 방문 전 문의하세요.
          </p>
        </>
      }
      list={list}
      badge={(p) => (holesOf(p) ? `${holesOf(p)}홀` : null)}
      related={[
        { href: "/parkgolf-large", label: "대형 파크골프장 (36홀+)" },
        { href: "/parkgolf", label: "전국 파크골프장 지도" },
        { href: "/course", label: "파크골프 하루 코스" },
      ]}
    />
  );
}
