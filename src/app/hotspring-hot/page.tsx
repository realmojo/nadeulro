import type { Metadata } from "next";

import { ThemeListPage, parseTempC } from "@/components/place/theme-page";
import { fetchPlaces } from "@/lib/places-server";
import type { Place } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

const MIN_TEMP = 40;

export const metadata: Metadata = {
  title: "뜨거운 원탕 온천 — 수온 40°C 이상",
  description:
    "공개된 수온이 40°C 이상인 전국 온천을 지역별로 정리했습니다. 가온 없이도 뜨끈한 원탕을 수온·위치·연락처와 함께 확인하세요.",
  alternates: { canonical: `${siteConfig.url}/hotspring-hot` },
};

export default async function HotspringHotPage() {
  let list: Place[] = [];
  try {
    const { places } = await fetchPlaces();
    list = places.filter(
      (p) =>
        p.category === "hotspring" &&
        (parseTempC(p.attributes.temp) ?? 0) >= MIN_TEMP,
    );
    list.sort(
      (a, b) =>
        (parseTempC(b.attributes.temp) ?? 0) - (parseTempC(a.attributes.temp) ?? 0),
    );
  } catch {
    /* 조회 실패해도 페이지는 뜬다 */
  }

  return (
    <ThemeListPage
      category="hotspring"
      title="뜨거운 원탕 온천"
      description={`수온 ${MIN_TEMP}°C 이상 — 가온 없이도 뜨끈한 전국 원탕 온천 모음.`}
      intro={
        <>
          <p>
            공개된 수온이{" "}
            <b className="font-bold text-foreground">{MIN_TEMP}°C 이상</b>인
            전국 온천 <b className="font-bold text-foreground">{list.length.toLocaleString()}곳</b>
            입니다. 체온보다 충분히 높은 물이 솟는 곳이라, 데우지 않은 원탕의
            온기를 그대로 느낄 수 있습니다.
          </p>
          <p>
            수온이 높은 순으로 정렬했습니다. 각 온천의{" "}
            <b className="font-semibold text-foreground">수온·성분·연락처</b>는
            상세페이지에서 확인하세요.
          </p>
        </>
      }
      list={list}
      badge={(p) => (p.attributes.temp && p.attributes.temp !== "-" ? p.attributes.temp : null)}
      related={[
        { href: "/hotspring-sulfur", label: "유황온천 모음" },
        { href: "/hotspring", label: "전국 온천 지도" },
        { href: "/course", label: "온천 하루 코스" },
      ]}
    />
  );
}
