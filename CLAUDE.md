@AGENTS.md

# 나들로 (nadeulro)

액티브 시니어(**신청년**, 50~60대)를 위한 여가·나들이 **코스** 플랫폼.
파크골프 · 온천 · 등산 · 숙박을 하나의 하루/1박 코스로 잇는다.
전체 기획은 `PROJECT_BRIEF.md` 참고 (작업의 기준 문서).

## 반드시 지킬 규칙
- **금지 표현:** "시니어 / 실버 / 노인" → '어른 · 신청년 · 나들이' 톤 사용.
- **차별점:** 개별 디렉터리 나열 ❌ → "코스 묶음"으로 잇는다(`/course`가 핵심).
- **접근성(50+):** 기본 글씨 18px+, 탭 타깃 44px+, WCAG AA 대비, 포커스 표시,
  `prefers-reduced-motion` 존중. UI는 크고 단순하게.

## 스택 / 규칙
- Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui(new-york) · lucide.
- 테마 토큰은 `src/app/globals.css` (olive base + green). 색은 하드코딩 대신 토큰 사용.
- 공통 상수/내비: `src/lib/site.ts`. UI 프리미티브: `src/components/ui/`.
- 지도: `src/lib/kakao-map.ts` (앱키 `NEXT_PUBLIC_KAKAO_MAP_KEY`, 배포 도메인 등록 필요).
- 파크골프 데이터: `src/lib/parkgolf.ts` + `scripts/merge-parkgolf.ts` + `data/parkgolf/`.
