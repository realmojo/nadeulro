import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "숙박",
  description:
    "온천·여행과 묶어 여유로운 1박 코스로. 나들로가 숙소까지 이어드립니다.",
};

export default function StayPage() {
  return (
    <>
      <PageHeader
        eyebrow="숙박"
        title="1박 코스로 완성하기"
        description="온천·여행과 묶어 하룻밤. 예약 제휴로 코스를 마무리합니다."
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">준비 중 (P3)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-muted-foreground">
              코스와 연결되는 숙소 추천과 예약 제휴 링크가 P3 단계에서
              연결됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
