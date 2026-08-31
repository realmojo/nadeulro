import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Workers 배포(OpenNext) 호환 설정.
  // 내장 이미지 최적화는 OpenNext 핸들러 용량을 키워 Worker 64MiB 한도를
  // 넘기므로 비활성화한다. (kakao/외부 이미지는 원본 그대로 사용)
  images: {
    unoptimized: true,
  },

  // 구 도메인(nadeulro.com)으로 들어온 모든 요청을 새 도메인으로 301 이전.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "nadeulro.com" }],
        destination: "https://nadeulro.keywordegg.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "www.nadeulro.com" }],
        destination: "https://nadeulro.keywordegg.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

// 로컬 `next dev` 에서도 Cloudflare 바인딩(env/캐시)을 사용할 수 있게 초기화.
// (프로덕션 빌드/런타임에는 영향 없음)
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
