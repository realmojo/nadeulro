import type { Metadata } from "next";
import Link from "next/link";

import { CourseMaker } from "@/components/tools/course-maker";
import { ToolShell, toolMetadata } from "@/components/tools/tool-shell";
import { toolByKey } from "@/lib/tools";

export const revalidate = 86400;

const tool = toolByKey("course-maker");

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
              "가고 싶은 곳을 검색해 담습니다. 파크골프장·온천·수영장·산·수목원을 섞어 담을 수 있습니다.",
              "화살표로 순서를 바꾸면 구간마다 거리와 차로 시간이 다시 계산됩니다.",
              "세 곳 이상이면 ‘가까운 순으로 정렬’이 첫 곳에서 시작해 가장 가까운 곳끼리 이어 줍니다.",
              "‘공유 주소 만들기’를 누르면 코스가 담긴 주소가 복사됩니다. 함께 갈 사람에게 보내면 같은 코스를 그대로 볼 수 있습니다.",
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
            코스를 짤 때 참고할 점
          </h2>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            거리는 두 지점을 잇는 직선거리이고 소요 시간은 이를 차로 환산한
            어림값입니다. 산길이나 국도가 많은 구간은 실제로 더 걸립니다. 하루에
            여러 곳을 도는 일정이라면 이동 시간을 계산값보다 넉넉히 잡고, 마지막
            목적지는 온천처럼 늦게까지 여는 곳으로 두면 여유가 생깁니다.
          </p>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            직접 짜기 번거로우면 나들로가 미리 이어 둔{" "}
            <Link href="/course" className="font-semibold text-primary hover:underline">
              나들이 코스
            </Link>
            나 동네별로 묶어 본{" "}
            <Link href="/near" className="font-semibold text-primary hover:underline">
              동네별 나들이
            </Link>
            를 참고하셔도 좋습니다.
          </p>
        </section>
      }
    >
      <CourseMaker />
    </ToolShell>
  );
}
