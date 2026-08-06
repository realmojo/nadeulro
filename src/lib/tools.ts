/**
 * 나들로 무료 도구 — 메타데이터 한 곳 정의.
 * 사이트맵·내비·도구 목록 페이지가 모두 여기를 참조한다(경로 중복 정의 방지).
 */
export type ToolKey =
  | "nearby"
  | "parkgolf-score"
  | "hiking-time"
  | "hiking-pace"
  | "weather-safety"
  | "course-maker";

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
    key: "nearby",
    path: "/tools/nearby",
    title: "가까운 나들이 찾기",
    metaTitle: "가까운 나들이 찾기 — 내 위치 기준 반경 검색",
    blurb: "지금 있는 곳에서 정해진 거리 안에 있는 나들이 스팟을 찾습니다.",
    description:
      "현재 위치나 지역을 기준으로 반경을 정하면 그 안의 파크골프장·온천·수영장·산·수목원을 가까운 순서로 보여줍니다. 각각까지의 거리와 차로 걸리는 시간을 함께 계산합니다.",
    when: "갑자기 시간이 비었을 때",
  },
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
    key: "hiking-pace",
    path: "/tools/hiking-pace",
    title: "산행 소요 시간 계산기",
    metaTitle: "산행 소요 시간 계산기 — 거리·고도로 계산",
    blurb: "거리와 고도 상승을 넣으면 실제로 몇 시간 걸릴지 계산합니다.",
    description:
      "네이스미스 규칙에 하강 보정·페이스·배낭 무게·휴식 시간을 더해 산행 소요 시간을 추정합니다. 계산한 시간은 출발 시각 계산기로 그대로 넘겨 일몰까지 역산할 수 있습니다.",
    when: "코스를 고르고 일정을 가늠할 때",
  },
  {
    key: "weather-safety",
    path: "/tools/weather-safety",
    title: "야외 활동 날씨 안전 계산기",
    metaTitle: "야외 활동 날씨 안전 계산기 — 열지수·체감온도",
    blurb: "기온에 습도와 바람을 더해 오늘 나가도 되는지 판단합니다.",
    description:
      "여름은 열지수, 겨울은 체감온도를 기상청 표준식으로 계산해 온열질환·동상 위험을 알려드립니다. 기온만 보고 판단하기 어려운 날에 활동 여부를 정하는 데 쓰세요.",
    when: "나가기 전 오늘 날씨가 애매할 때",
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
