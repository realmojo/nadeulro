import type { Metadata } from "next";
import Link from "next/link";

import { ParkgolfScorecard } from "@/components/tools/parkgolf-scorecard";
import { ToolShell, toolMetadata } from "@/components/tools/tool-shell";
import { toolByKey } from "@/lib/tools";

export const revalidate = 86400;

const tool = toolByKey("parkgolf-score");

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      footer={
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold md:text-2xl">
            이렇게 쓰세요
          </h2>
          <ol className="mt-3 grid gap-2.5">
            {[
              "구장을 검색해 고르면 그 구장의 홀 수가 자동으로 맞춰집니다. 구장을 고르지 않고 홀 수만 정해서 써도 됩니다.",
              "함께 치는 사람을 최대 4명까지 추가하고 이름을 적습니다.",
              "홀마다 사람별로 + 와 − 를 눌러 타수를 기록하고, 화살표로 다음 홀로 넘어갑니다.",
              "합계에서 기준 타수 대비 성적을 확인하고, ‘결과 복사’로 단체 대화방에 붙여넣습니다.",
            ].map((s, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-border/70 bg-card p-3"
              >
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                >
                  {i + 1}
                </span>
                <span className="break-keep text-base leading-relaxed text-foreground/85">
                  {s}
                </span>
              </li>
            ))}
          </ol>

          <h2 className="font-display mt-8 text-xl font-bold md:text-2xl">
            기준 타수(파)에 대하여
          </h2>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            파크골프는 홀당 파 3이 기본이지만, 거리에 따라 파 4·파 5 홀을 둔
            구장도 있습니다. 공개된 자료에는 홀별 파가 들어 있지 않아 기본값을 파
            3으로 두었고, 홀마다 직접 바꿀 수 있게 했습니다. 현장 안내판의 파를
            보고 맞춰 두면 기준 대비 성적이 정확해집니다.
          </p>

          <p className="mt-6 break-keep text-base leading-relaxed text-muted-foreground">
            전국 파크골프장의 위치·홀 수·연락처는{" "}
            <Link href="/parkgolf" className="font-semibold text-primary hover:underline">
              파크골프장 목록
            </Link>
            에서 확인할 수 있고, 라운드 뒤 들를 만한 가까운 온천은 각 구장
            페이지의 반경 정보에서 볼 수 있습니다.
          </p>
        </section>
      }
    >
      <ParkgolfScorecard />
    </ToolShell>
  );
}
