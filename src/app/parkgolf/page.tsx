import type { Metadata } from "next";
import { MapPinned, Filter, Navigation } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRegions } from "@/lib/parkgolf";

export const metadata: Metadata = {
  title: "파크골프장 찾기",
  description:
    "전국 파크골프장을 지도에서 찾아보세요. 지역·거리·홀수로 필터링하고 길찾기까지.",
};

const steps = [
  {
    icon: MapPinned,
    title: "지도에서 찾기",
    desc: "카카오맵 위 마커로 가까운 파크골프장을 확인합니다. (P1 연결 예정)",
  },
  {
    icon: Filter,
    title: "필터로 좁히기",
    desc: "지역 · 거리 · 홀수(9/18/27홀)로 원하는 곳만 추립니다.",
  },
  {
    icon: Navigation,
    title: "상세 · 길찾기",
    desc: "위치 · 요금 · 연락처를 확인하고 바로 길찾기로 연결합니다.",
  },
];

export default function ParkGolfPage() {
  const regions = getRegions();

  return (
    <>
      <PageHeader
        eyebrow="파크골프"
        title="파크골프장 찾기"
        description="전국 파크골프장을 지도에서 한눈에. 가까운 곳부터 홀수까지 골라보세요."
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* 지도 자리 (P1에서 카카오맵 연결) */}
        <div
          className="flex min-h-64 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-center"
          role="img"
          aria-label="지도 영역 (준비 중)"
        >
          <p className="px-6 text-lg text-muted-foreground">
            🗺️ 지도(카카오맵)는 공공데이터 통합 후 P1 단계에서 연결됩니다.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title}>
                <CardHeader>
                  <Icon className="size-8 text-primary" aria-hidden="true" />
                  <CardTitle className="mt-2 text-lg">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">지역으로 찾기</h2>
          {regions.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {regions.map((r) => (
                <li
                  key={r}
                  className="rounded-md border bg-card px-4 py-2 text-base"
                >
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-muted-foreground">
              아직 통합 데이터가 없습니다.{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">
                scripts/merge-parkgolf.ts
              </code>{" "}
              로 시·도별 CSV를 <code>data/parkgolf/parkgolf.json</code> 으로
              통합하면 이곳에 지역 목록이 나타납니다.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
