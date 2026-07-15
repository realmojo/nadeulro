# data/parkgolf

파크골프장 공공데이터 저장소.

- `raw/` — 공공데이터포털(data.go.kr)에서 내려받은 시·도별 원본 CSV (예: `gyeonggi.csv`).
- `parkgolf.json` — `scripts/merge-parkgolf.ts` 로 통합·정규화한 전국 데이터 (앱이 읽는 파일).

## 갱신 방법

1. 공공데이터포털에서 시·도별 파크골프장 CSV를 받아 `raw/` 아래에 둔다.
2. `pnpm tsx scripts/merge-parkgolf.ts` 실행 → `parkgolf.json` 생성.
3. 좌표 없는 항목은 카카오 로컬 API로 지오코딩 보강.

> 원본 CSV(`raw/`)는 용량이 크면 커밋에서 제외할 수 있습니다. 통합본
> `parkgolf.json` 은 정적 로드를 위해 커밋합니다.
