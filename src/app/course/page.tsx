import type { Metadata } from "next";
import { Flag, Waves, UtensilsCrossed, BedDouble } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "코스 묶음",
  description:
    "파크골프 + 온천 + 맛집/숙박을 하루·1박 코스로 잇습니다. 나들로만의 코스 추천.",
};

const sampleCourse = [
  {
    icon: Flag,
    time: "오전",
    title: "파크골프 18홀",
    desc: "가까운 파크골프장에서 가볍게 라운딩으로 하루를 엽니다.",
  },
  {
    icon: UtensilsCrossed,
    time: "점심",
    title: "근처 맛집",
    desc: "차로 10~15분, 지역 맛집에서 든든하게.",
  },
  {
    icon: Waves,
    time: "오후",
    title: "온천에서 휴식",
    desc: "라운딩으로 쓴 몸을 온천에서 풀어줍니다.",
  },
  {
    icon: BedDouble,
    time: "저녁",
    title: "1박 숙소",
    desc: "여유가 있다면 근처 숙소에서 하룻밤, 1박 코스로.",
  },
];

export default function CoursePage() {
  return (
    <>
      <PageHeader
        eyebrow="나들로의 차별점"
        title="하루가 하나의 코스로"
        description="개별 장소를 나열하지 않습니다. 파크골프 → 온천 → 맛집·숙박까지 흐름으로 잇습니다."
      />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <Badge variant="secondary" className="mb-6 text-base">
          예시 코스 · 하루 나들이
        </Badge>

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sampleCourse.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span
                        className="flex size-9 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <Badge variant="outline">{step.time}</Badge>
                    </div>
                    <Icon
                      className="mt-3 size-8 text-primary"
                      aria-hidden="true"
                    />
                    <CardTitle className="mt-2 text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base text-muted-foreground">
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>

        <p className="mt-10 text-base text-muted-foreground">
          실제 코스 데이터(파크골프장 ↔ 온천 ↔ 숙박 연결)는 P3 단계에서
          채워집니다. 지역별 추천 코스와 예약·제휴 링크가 이어질 예정입니다.
        </p>
      </div>
    </>
  );
}
