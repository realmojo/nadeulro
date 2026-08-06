import type { Metadata } from "next";
import Link from "next/link";

import { HikingTimePlanner } from "@/components/tools/hiking-time-planner";
import { ToolShell, toolMetadata } from "@/components/tools/tool-shell";
import { toolByKey } from "@/lib/tools";

export const revalidate = 86400;

const tool = toolByKey("hiking-time");

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      footer={
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold md:text-2xl">
            어떻게 계산하나요
          </h2>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            산마다 좌표가 다르면 해가 지는 시각도 달라집니다. 같은 날이라도
            동쪽 끝과 서쪽 끝은 일몰이 30분 넘게 차이 납니다. 이 계산기는 고른
            산의 위도·경도와 날짜로 그날의 일출·일몰을 직접 계산한 뒤,
            어두워지기 30분 전에 하산을 마치는 것을 목표로 출발 시각을
            역산합니다.
          </p>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            낮 시간보다 예상 산행 시간이 길면 그날 당일 산행이 어렵다고
            알려드립니다. 겨울에는 낮이 아홉 시간 남짓으로 짧아져, 여름에 여유
            있던 코스도 무리가 되는 경우가 있습니다.
          </p>

          <h2 className="font-display mt-8 text-xl font-bold md:text-2xl">
            여유 있게 잡아야 하는 이유
          </h2>
          <ul className="mt-3 grid gap-2.5">
            {[
              "산속은 능선과 골짜기에 해가 가리면 일몰 전부터 어두워집니다. 특히 북쪽 사면과 계곡 구간이 빠르게 어두워집니다.",
              "예상 산행 시간에는 휴식·식사·사진 찍는 시간을 모두 포함해 넉넉히 잡으세요. 오르막보다 내리막에서 시간이 더 걸리는 경우도 흔합니다.",
              "일행이 여럿이면 가장 느린 사람의 속도가 전체 속도가 됩니다.",
              "헤드랜턴은 계획과 무관하게 항상 챙기세요. 예정보다 늦어지는 일은 생각보다 자주 생깁니다.",
            ].map((s) => (
              <li
                key={s}
                className="rounded-xl border border-border/70 bg-card p-3 text-base leading-relaxed text-foreground/85"
              >
                {s}
              </li>
            ))}
          </ul>

          <p className="mt-6 break-keep text-base leading-relaxed text-muted-foreground">
            각 산의 월별 일출·일몰 표는{" "}
            <Link href="/hiking" className="font-semibold text-primary hover:underline">
              산 목록
            </Link>
            의 개별 페이지에서도 볼 수 있습니다. 계산값은 한국 표준시 기준이며,
            기상 상황에 따른 체감 밝기는 반영하지 않습니다.
          </p>
        </section>
      }
    >
      <HikingTimePlanner />
    </ToolShell>
  );
}
