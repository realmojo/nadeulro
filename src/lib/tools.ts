/**
 * 나들로 무료 도구 — 메타데이터 한 곳 정의.
 * 사이트맵·내비·도구 목록 페이지가 모두 여기를 참조한다(경로 중복 정의 방지).
 */
export type ToolKey = "parkgolf-score" | "hiking-time" | "course-maker";

export type Tool = {
  key: ToolKey;
  path: string;
  /** 페이지 h1 · 목록 카드 제목 */
  title: string;
  /** <title> 및 검색 결과용 (사이트명은 template 이 붙인다) */
  metaTitle: string;
  /** 한 줄 소개 */
  blurb: string;
  /** 메타 설명 (155자 안쪽) */
  description: string;
  /** 도구 목록에서 강조할 사용 상황 */
  when: string;
};

export const TOOLS: Tool[] = [
  {
    key: "parkgolf-score",
    path: "/tools/parkgolf-score",
    title: "파크골프 스코어카드",
    metaTitle: "파크골프 스코어카드 — 무료 온라인 기록",
    blurb: "최대 4명까지, 홀별 타수를 기록하고 합계를 자동으로 계산합니다.",
    description:
      "전국 파크골프장을 고르면 홀 수가 자동으로 맞춰집니다. 최대 4명까지 홀별 타수를 적고 파 대비 성적을 바로 확인하세요. 설치도 로그인도 필요 없습니다.",
    when: "라운드 중에 종이 스코어카드 대신",
  },
  {
    key: "hiking-time",
    path: "/tools/hiking-time",
    title: "산행 출발 시각 계산기",
    metaTitle: "산행 출발 시각 계산기 — 일몰 역산",
    blurb: "산과 예상 소요 시간을 고르면 언제 출발해야 하는지 알려줍니다.",
    description:
      "전국 산 1,300여 곳의 좌표로 그날의 일몰 시각을 계산해, 어두워지기 전에 내려오려면 몇 시에 출발해야 하는지 역산합니다. 계절마다 답이 달라집니다.",
    when: "산에 가기 전날 밤이나 당일 아침에",
  },
  {
    key: "course-maker",
    path: "/tools/course-maker",
    title: "내 나들이 코스 만들기",
    metaTitle: "내 나들이 코스 만들기 — 거리·시간 자동 계산",
    blurb: "가고 싶은 곳을 골라 담으면 이동 거리와 시간을 계산해 줍니다.",
    description:
      "파크골프장·온천·수영장·산·수목원을 골라 담으면 순서대로 이동 거리와 차로 소요 시간을 계산합니다. 만든 코스는 주소 하나로 공유할 수 있습니다.",
    when: "하루 일정을 미리 짜볼 때",
  },
];

export function toolByKey(key: ToolKey): Tool {
  const t = TOOLS.find((x) => x.key === key);
  if (!t) throw new Error(`알 수 없는 도구: ${key}`);
  return t;
}

/** 도구 목록 페이지 자체의 메타 */
export const TOOLS_INDEX = {
  path: "/tools",
  title: "나들이 도구",
  description:
    "파크골프 스코어카드, 산행 출발 시각 계산기, 나들이 코스 만들기. 설치도 로그인도 없이 바로 쓰는 나들로 무료 도구입니다.",
};
