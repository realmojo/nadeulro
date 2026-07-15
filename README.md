# 나들로 (nadeulro)

**파크골프·온천·등산·숙박까지, 오늘 뭐하지?**

액티브 시니어(**신청년**, 50~60대)를 위한 여가·나들이 **코스** 플랫폼.
파크골프 · 온천 · 등산 · 숙박을 하나의 하루/1박 코스로 잇습니다.

> 전체 기획은 [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md) 를 참고하세요.

## 기술 스택

- **Next.js 16** (App Router) · **React 19**
- **Tailwind CSS v4** + **shadcn/ui** (new-york 스타일, olive/green 테마) · lucide-react
- 지도: **카카오맵 JavaScript SDK**
- 데이터: 공공데이터포털 CSV → 통합 JSON (확장 시 Supabase)

## 시작하기

```bash
pnpm install
cp .env.local.example .env.local   # 카카오 앱키 등 입력
pnpm dev
```

http://localhost:3000 에서 확인합니다.

## 환경변수

`.env.local.example` 참고. 최소 `NEXT_PUBLIC_KAKAO_MAP_KEY` (카카오맵 JS 키)가
필요하며, **배포 도메인을 카카오 개발자 콘솔에 사전 등록**해야 지도가 동작합니다.

## 디렉터리

```
src/
├─ app/            # 라우트 (/, parkgolf, course, guide, onsen, stay)
├─ components/     # site-header/footer, page-header, ui/ (shadcn)
└─ lib/            # site 상수, kakao-map 로더, parkgolf 데이터 로더
data/parkgolf/     # 공공데이터 원본(raw) + 통합 parkgolf.json
scripts/           # merge-parkgolf.ts (시·도 CSV → 전국 통합)
```

## 로드맵

- **P0 기반** ✅ — 스캐폴딩, 랜딩+태그라인, 접근성 토큰, 라우트 골격.
- **P1 파크골프 찾기** — 공공데이터 통합/지오코딩 → 지도 + 필터 + 상세.
- **P2 콘텐츠/SEO** — 입문 가이드 + FAQ + JSON-LD.
- **P3 코스 & 수익** — 코스 묶음 + 온천·숙박 제휴 링크.
- **P4 확장** — 수영·등산 콘텐츠, GEO.

## 접근성

기본 글씨 18px, 탭 타깃 44px+, WCAG AA 대비, 키보드 포커스 표시,
`prefers-reduced-motion` 존중, 본문 바로가기 링크.
