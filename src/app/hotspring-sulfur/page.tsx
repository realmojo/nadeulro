import type { Metadata } from "next";

import { ThemeListPage } from "@/components/place/theme-page";
import { fetchPlaces } from "@/lib/places-server";
import type { Place } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "전국 유황온천 모음",
  description:
    "이름이나 수질 성분에서 유황이 확인되는 전국 온천을 지역별로 정리했습니다. 위치·수온·연락처를 확인하고 유황탕 나들이를 떠나보세요.",
  alternates: { canonical: `${siteConfig.url}/hotspring-sulfur` },
};

/** 이름·수질 성분에 '유황'이 명시된 곳만 — 추정 분류는 하지 않는다 */
function isSulfur(p: Place): boolean {
  const c = p.attributes.composition ?? "";
  return p.name.includes("유황") || c.includes("유황");
}

export default async function HotspringSulfurPage() {
  let list: Place[] = [];
  try {
    const { places } = await fetchPlaces();
    list = places.filter((p) => p.category === "hotspring" && isSulfur(p));
  } catch {
    /* 조회 실패해도 페이지는 뜬다 */
  }

  return (
    <ThemeListPage
      category="hotspring"
      title="전국 유황온천"
      description="이름·수질 성분에서 유황이 확인되는 전국 온천 모음."
      intro={
        <>
          <p>
            시설 이름이나 공개된 수질 성분에{" "}
            <b className="font-bold text-foreground">유황</b>이 명시된 전국 온천{" "}
            <b className="font-bold text-foreground">{list.length.toLocaleString()}곳</b>
            입니다. 특유의 향과 함께 몸이 풀리는 유황탕을 찾는 분들이 많아
            따로 모았습니다.
          </p>
          <p>
            실제 수질·효능은 시설마다 다르니, 상세페이지의{" "}
            <b className="font-semibold text-foreground">수온·성분·연락처</b>를
            확인하고 방문 전 전화로 문의하는 것이 정확합니다.
          </p>
        </>
      }
      list={list}
      badge={(p) => (p.attributes.temp && p.attributes.temp !== "-" ? p.attributes.temp : null)}
      related={[
        { href: "/hotspring-hot", label: "뜨거운 원탕 온천" },
        { href: "/hotspring", label: "전국 온천 지도" },
        { href: "/course", label: "온천 하루 코스" },
      ]}
    />
  );
}
