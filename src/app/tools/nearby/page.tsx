import type { Metadata } from "next";
import Link from "next/link";

import { NearbyFinder } from "@/components/tools/nearby-finder";
import { ToolShell, toolMetadata } from "@/components/tools/tool-shell";
import { toolByKey } from "@/lib/tools";

export const revalidate = 86400;

const tool = toolByKey("nearby");

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
              "‘현재 위치로 찾기’를 누르고 브라우저가 묻는 위치 권한을 허용합니다. 권한을 주기 싫다면 아래 지역 버튼으로도 찾을 수 있습니다.",
              "반경을 고릅니다. 20km 는 차로 30분 안팎, 50km 는 한 시간 남짓 걸리는 거리입니다.",
              "보고 싶은 종류만 남깁니다. 버튼 옆 숫자가 반경 안에 몇 곳 있는지 알려 줍니다.",
              "목록은 가까운 순서입니다. 눌러 들어가면 연락처와 주변 정보를 볼 수 있습니다.",
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
            위치 정보는 어떻게 쓰나요
          </h2>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            브라우저가 알려 준 좌표는 이 화면 안에서 거리 계산에만 쓰입니다.
            서버로 보내지 않고 저장하지도 않으므로, 창을 닫으면 사라집니다.
            위치 권한을 주기 어렵다면 지역 버튼을 쓰면 됩니다. 이때는 그 시도에
            있는 스팟들의 평균 좌표를 기준점으로 삼습니다.
          </p>

          <p className="mt-6 break-keep text-base leading-relaxed text-muted-foreground">
            동네 단위로 무엇이 있는지 한눈에 보고 싶다면{" "}
            <Link href="/near" className="font-semibold text-primary hover:underline">
              동네별 나들이
            </Link>
            를, 여러 곳을 하루에 묶고 싶다면{" "}
            <Link
              href="/tools/course-maker"
              className="font-semibold text-primary hover:underline"
            >
              내 나들이 코스 만들기
            </Link>
            를 함께 써 보세요.
          </p>
        </section>
      }
    >
      <NearbyFinder />
    </ToolShell>
  );
}
