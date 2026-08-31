import { NextResponse, type NextRequest } from "next/server";

/**
 * 구 도메인(nadeulro.com)으로 들어온 모든 요청을 새 도메인으로 301 이전.
 * - next.config 의 redirects() 는 OpenNext(Cloudflare) 라우팅에서 `:path*`
 *   치환이 되지 않아(리터럴 ":path*" 로 이동) 여기서 직접 처리한다.
 * - Next 16 의 proxy.ts 는 Node 런타임 전용인데 OpenNext Cloudflare 가
 *   Node 미들웨어를 아직 지원하지 않으므로, edge 로 빌드되는 구
 *   middleware.ts 컨벤션을 사용한다(빌드 시 deprecation 경고는 무해).
 */
const OLD_HOSTS = new Set(["nadeulro.com", "www.nadeulro.com"]);
const NEW_ORIGIN = "https://nadeulro.keywordegg.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (OLD_HOSTS.has(host)) {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`${NEW_ORIGIN}${pathname}${search}`, 301);
  }
  return NextResponse.next();
}
