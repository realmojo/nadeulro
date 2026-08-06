import type { Metadata } from "next";
import Link from "next/link";

import { HikingPacePlanner } from "@/components/tools/hiking-pace-planner";
import { ToolShell, toolMetadata } from "@/components/tools/tool-shell";
import { toolByKey } from "@/lib/tools";

export const revalidate = 86400;

const tool = toolByKey("hiking-pace");

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      footer={
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold md:text-2xl">
            네이스미스 규칙이란
          </h2>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            1892년 스코틀랜드 등산가 윌리엄 네이스미스가 만든 어림법입니다.
            평지를 시속 5km로 걷는다고 보고, 고도가 100m 오를 때마다 10분을
            더합니다. 산행 시간은 거리보다 <strong>오르막 높이</strong>에 훨씬
            크게 좌우된다는 점을 짚은 규칙이라 지금도 널리 쓰입니다.
          </p>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            다만 이 규칙은 체력 좋은 사람이 쉬지 않고 걷는 것을 전제합니다.
            그대로 쓰면 실제보다 짧게 나오기 때문에, 여기서는 걷는 속도 계수와
            휴식 시간을 따로 더해 넉넉한 쪽으로 잡았습니다. 산행 시간을 짧게
            잡아서 생기는 문제가 길게 잡아서 생기는 문제보다 훨씬 위험하기
            때문입니다.
          </p>

          <h2 className="font-display mt-8 text-xl font-bold md:text-2xl">
            거리와 고도는 어디서 확인하나요
          </h2>
          <ul className="mt-3 grid gap-2.5">
            {[
              "국립공원이나 지자체 등산 안내도에 코스별 거리와 소요 시간이 적혀 있습니다.",
              "등산 앱의 코스 정보에서 누적 상승고도를 확인할 수 있습니다. ‘정상 높이’가 아니라 ‘누적 상승’ 값을 넣어야 정확합니다.",
              "들머리가 이미 높은 곳에 있으면 실제 상승은 정상 해발보다 훨씬 적습니다. 예를 들어 해발 1,000m 산이라도 800m 지점에서 출발하면 상승은 200m 입니다.",
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
            계산한 소요 시간은{" "}
            <Link
              href="/tools/hiking-time"
              className="font-semibold text-primary hover:underline"
            >
              산행 출발 시각 계산기
            </Link>
            로 넘겨 그 산의 일몰 시각까지 함께 확인할 수 있습니다. 산별 월별
            일몰표는{" "}
            <Link href="/hiking" className="font-semibold text-primary hover:underline">
              산 목록
            </Link>
            의 개별 페이지에 있습니다.
          </p>
        </section>
      }
    >
      <HikingPacePlanner />
    </ToolShell>
  );
}
