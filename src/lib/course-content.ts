/**
 * 코스 상세용 경험형 편집 콘텐츠 생성 (순수 함수).
 * 실제 후기가 아닌 나들로 편집자 관점의 '이렇게 즐겨보세요' 가이드를,
 * 코스별로 다르게(id-해시 변형) 생성한다.
 */
import type { Course, CourseStop } from "@/lib/course";

function hash(n: number): number {
  let h = (n * 2654435761) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}
function pickOne<T>(pool: T[], seed: number): T {
  return pool[hash(seed) % pool.length];
}

function actLabel(s: CourseStop): string {
  if (s.category === "parkgolf") return "파크골프";
  if (s.category === "hiking") return "산책·등산";
  if (s.category === "swim") return "수영";
  return "온천";
}

function firstActivity(c: Course): CourseStop | undefined {
  return c.stops.find((s) => s.category !== "hotspring");
}
function midActivity(c: Course): CourseStop | undefined {
  const acts = c.stops.filter((s) => s.category !== "hotspring");
  return acts.length >= 2 ? acts[1] : undefined;
}
function onsen(c: Course): CourseStop | undefined {
  return c.stops.find((s) => s.category === "hotspring");
}

export type CourseFaq = { q: string; a: string };

/** 왜 이 조합인가 — 도입 문단 */
export function courseIntro(c: Course): string {
  const a = firstActivity(c);
  const o = onsen(c);
  const place = [c.region, c.city].filter(Boolean).join(" ");
  if (!a || !o) return "";
  const opener = pickOne(
    [
      `${place}에서 하루를 알차게 보내고 싶다면, 이 코스처럼 활동과 휴식을 이어 보세요.`,
      `장소 하나만 다녀오기 아쉬운 날, ${place}의 이 코스가 좋은 답이 됩니다.`,
      `${place} 나들이를 계획한다면, 흩어진 장소를 따로 찾는 대신 이렇게 하루로 묶어 보세요.`,
    ],
    c.id,
  );
  const why = pickOne(
    [
      `오전에 ${actLabel(a)}으로 몸을 가볍게 움직이고, 오후에 ${o.name}에서 뜨끈하게 풀어 주면 그날의 피로가 한결 가볍습니다.`,
      `${actLabel(a)}으로 쌓인 기분 좋은 노곤함을 ${o.name}에서 이완시키는 흐름이라, 운동과 휴식이 자연스럽게 이어집니다.`,
      `활동으로 하루를 열고 온천으로 마무리하는 순서는, 특히 무리하지 않고 알차게 즐기고 싶은 어른들의 하루 나들이로 잘 맞습니다.`,
    ],
    c.id + 7,
  );
  return `${opener} ${why}`;
}

/** 이렇게 즐겨보세요 — 단계별 경험형 문단들 */
export function courseHowTo(c: Course): string[] {
  const a = firstActivity(c);
  const m = midActivity(c);
  const o = onsen(c);
  const paras: string[] = [];
  if (a) {
    if (a.category === "parkgolf") {
      paras.push(
        pickOne(
          [
            `오전은 ${a.name}에서 엽니다. 사람이 적은 이른 시간에 나가 9홀 정도 가볍게 돌면, 걷고 스윙하며 몸이 자연스럽게 깨어납니다. 승부에 매이기보다 잔디를 밟는 기분을 즐기는 것이 이 코스의 첫 단추입니다.`,
            `첫 일정은 ${a.name}입니다. 클럽 한 자루로 부담 없이 한 게임 돌며 하루를 여는데, 무릎·허리에 무리가 적어 오전 운동으로 딱 좋습니다. 이른 시간일수록 여유롭게 즐길 수 있습니다.`,
          ],
          c.id + 1,
        ),
      );
    } else {
      paras.push(
        pickOne(
          [
            `오전에는 ${a.name}을(를) 가볍게 걷습니다. 정상까지 무리해서 오르기보다, 둘레길이나 중턱까지 숲의 공기를 마시며 천천히 걷는 것으로 충분합니다.`,
            `첫 일정은 ${a.name} 산책입니다. 완만한 길을 골라 천천히 걸으며 자연을 느끼면, 마음까지 여유로워집니다.`,
          ],
          c.id + 1,
        ),
      );
    }
  }
  if (m) {
    paras.push(
      pickOne(
        [
          `이어서 ${m.name} 근처를 짧게 걸어 보세요. 본격적인 산행이 아니어도, 잠깐의 숲길이 오전의 활력을 더해 줍니다.`,
          `여유가 있다면 ${m.name}에서 가벼운 산책을 곁들여도 좋습니다. 무리하지 않는 선에서 자연을 한 번 더 느끼는 시간입니다.`,
        ],
        c.id + 2,
      ),
    );
  }
  if (o) {
    paras.push(
      pickOne(
        [
          `그리고 하루의 마무리는 ${o.name}입니다. 활동으로 데워진 몸을 따뜻한 물에 맡기면, 뭉친 근육이 스르르 풀리며 개운함이 밀려옵니다. 운동 직후라면 미지근한 물부터, 반신욕으로 천천히 시작하세요.`,
          `마지막은 ${o.name}에서의 휴식입니다. 오전에 쓴 몸을 뜨끈하게 풀어 주면 그날 밤 잠도 한결 편안합니다. 오래 담그기보다 5~10분씩 나눠서, 물을 자주 마시며 즐기는 것이 좋습니다.`,
        ],
        c.id + 3,
      ),
    );
  }
  return paras;
}

/** 이런 분께 잘 맞아요 */
export function courseAudience(c: Course): string[] {
  return pickOne(
    [
      [
        "몸은 움직이고 싶지만 무리한 운동은 부담스러운 분",
        "하루 나들이로 활동과 휴식을 한 번에 누리고 싶은 분",
        "부모님을 모시고 가벼운 하루 코스를 찾는 분",
      ],
      [
        "운동 후 개운하게 몸을 풀며 하루를 마무리하고 싶은 분",
        "동호회·친구와 함께 알찬 하루를 보내고 싶은 분",
        "복잡한 계획 없이 동선이 짜인 코스를 그대로 따르고 싶은 분",
      ],
    ],
    c.id,
  );
}

/** 함께 알아두면 좋은 점 */
export function courseTips(c: Course): string[] {
  const o = onsen(c);
  return [
    "이동 시간은 직선거리 기준 대략값입니다. 실제 도로 상황에 따라 달라질 수 있어요.",
    "온천 운영시간·휴무일은 방문 전 전화로 확인하면 헛걸음을 줄일 수 있습니다.",
    "활동과 온천으로 땀을 많이 흘리니, 중간중간 수분을 충분히 보충하세요.",
    o
      ? "식사 직후 바로 입욕은 피하고, 30분~1시간 쉬었다 온천에 들어가는 것이 좋습니다."
      : "무리하지 말고 그날의 컨디션에 맞춰 일정을 조절하세요.",
  ];
}

/** 코스 FAQ (FAQPage 구조화 데이터용) */
export function courseFaqs(c: Course): CourseFaq[] {
  const o = onsen(c);
  const a = firstActivity(c);
  const faqs: CourseFaq[] = [];
  faqs.push({
    q: "이 코스를 다 도는 데 얼마나 걸리나요?",
    a: "장소 사이 이동은 길지 않아, 여유롭게 다녀도 반나절에서 하루면 충분합니다. 각 장소에서 머무는 시간에 따라 조절하면 됩니다.",
  });
  if (o && a) {
    faqs.push({
      q: "순서를 바꿔도 되나요?",
      a: `${o.name} 같은 온천은 활동으로 쓴 몸을 푸는 마무리로 두는 것이 가장 개운합니다. 되도록 ${actLabel(a)}을(를) 먼저, 온천을 마지막에 두는 것을 권합니다.`,
    });
  }
  faqs.push({
    q: "예약이 필요한가요?",
    a: "공영 파크골프장은 대개 선착순이고, 온천도 예약 없이 이용하는 곳이 많습니다. 다만 방문 전 각 시설에 전화로 운영 여부를 확인하는 것이 안전합니다.",
  });
  return faqs;
}
