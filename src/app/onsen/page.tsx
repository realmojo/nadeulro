import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "온천",
  description:
    "파크골프·나들이 뒤 몸을 풀어주는 온천. 코스와 묶어 하루·1박으로 즐기세요.",
};

export default function OnsenPage() {
  return (
    <>
      <PageHeader
        eyebrow="온천"
        title="라운딩 뒤, 온천에서 풀기"
        description="온천은 코스의 휴식 축이자 수익 엔진입니다. 숙박·입장권·패키지 제휴가 이어집니다."
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">준비 중 (P3)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base text-muted-foreground">
              지역별 온천과 코스 연결, 그리고 온천·숙박 제휴 링크가 P3 단계에서
              연결됩니다. 여행·숙박 고단가 제휴가 수익화의 시작점입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
