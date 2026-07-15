/**
 * 카카오맵 JavaScript SDK 로더.
 *
 * 주의(브리프 6절):
 *  - 등록한 도메인에서만 동작 → 배포 도메인 사전 등록 필요.
 *  - 2026-07-21부터 이용 절차/무료 쿼터 정책 변경(앱 활성화 후 비즈월렛 연결).
 *  - 앱키는 NEXT_PUBLIC_KAKAO_MAP_KEY 로 주입(JS 키, 클라이언트 노출 전제).
 */

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        [key: string]: unknown;
      };
    };
  }
}

const SDK_ID = "kakao-map-sdk";

/**
 * 카카오맵 SDK를 1회 로드하고, maps 네임스페이스가 준비되면 resolve.
 * `libraries=services,clusterer`: 지오코딩(로컬)·클러스터링 사용.
 */
export function loadKakaoMap(): Promise<NonNullable<Window["kakao"]>["maps"]> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("loadKakaoMap must run in the browser"));
      return;
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
      return;
    }

    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appKey) {
      reject(
        new Error(
          "NEXT_PUBLIC_KAKAO_MAP_KEY 가 설정되지 않았습니다 (.env.local 확인)"
        )
      );
      return;
    }

    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      window.kakao?.maps.load(() => resolve(window.kakao!.maps));
    };

    if (!existing) {
      script.id = SDK_ID;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services,clusterer`;
      script.addEventListener("load", onLoad);
      script.addEventListener("error", () =>
        reject(new Error("카카오맵 SDK 로드 실패"))
      );
      document.head.appendChild(script);
    } else {
      onLoad();
    }
  });
}
