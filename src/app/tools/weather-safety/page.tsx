import type { Metadata } from "next";
import Link from "next/link";

import { ToolShell, toolMetadata } from "@/components/tools/tool-shell";
import { WeatherSafety } from "@/components/tools/weather-safety";
import { toolByKey } from "@/lib/tools";

export const revalidate = 86400;

const tool = toolByKey("weather-safety");

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      footer={
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold md:text-2xl">
            왜 기온만으로는 부족한가요
          </h2>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            여름에는 습도가 결정적입니다. 땀이 증발하면서 몸을 식히는데, 습도가
            높으면 땀이 마르지 못해 체온이 떨어지지 않습니다. 같은 32℃라도
            습도 40%면 참을 만하지만 습도 80%면 체감 45℃에 가까워집니다.
          </p>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            겨울에는 바람이 결정적입니다. 피부 곁에 머무는 따뜻한 공기층을
            바람이 계속 걷어내기 때문입니다. 영하 5℃에 바람이 초속 5m 정도만
            불어도 체감은 영하 11℃ 안팎이 됩니다. 산 능선은 지상보다 바람이
            훨씬 셉니다.
          </p>

          <h2 className="font-display mt-8 text-xl font-bold md:text-2xl">
            나이가 들면 왜 더 조심해야 하나요
          </h2>
          <p className="mt-3 break-keep text-base leading-relaxed text-foreground/85">
            나이가 들수록 땀을 내는 기능과 갈증을 느끼는 감각이 함께 무뎌집니다.
            더위를 덜 느끼면서도 실제로는 체온이 오르고 있는 상태가 될 수
            있다는 뜻입니다. 추위에서도 혈관이 수축하면서 혈압이 오르기 쉬워,
            고혈압이나 심장질환이 있다면 이른 아침 찬 공기 노출을 특히 조심하는
            편이 좋습니다. 그래서 이 계산기는 일반 기준보다 한 단계 보수적으로
            경고 구간을 잡았습니다.
          </p>

          <p className="mt-6 break-keep text-base leading-relaxed text-muted-foreground">
            날씨가 나쁜 날에는 실내에서 즐길 수 있는{" "}
            <Link href="/hotspring" className="font-semibold text-primary hover:underline">
              온천
            </Link>
            이나{" "}
            <Link href="/swim" className="font-semibold text-primary hover:underline">
              수영장
            </Link>
            으로 목적지를 바꾸는 것도 방법입니다. 이 계산기는 참고용이며,
            기상특보가 발령된 날에는 특보 안내를 우선하세요.
          </p>
        </section>
      }
    >
      <WeatherSafety />
    </ToolShell>
  );
}
