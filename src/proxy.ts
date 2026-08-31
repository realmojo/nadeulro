import { NextResponse, type NextRequest } from "next/server";

/**
 * 구 도메인(nadeulro.com)으로 들어온 모든 요청을 새 도메인으로 301 이전.
 * next.config 의 redirects() 는 OpenNext(Cloudflare) 라우팅에서 `:path*`
 * 치환이 되지 않아(리터럴 ":path*" 로 이동) 프록시에서 직접 처리한다.
 */
const OLD_HOSTS = new Set(["nadeulro.com", "www.nadeulro.com"]);
const NEW_ORIGIN = "https://nadeulro.keywordegg.com";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (OLD_HOSTS.has(host)) {
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`${NEW_ORIGIN}${pathname}${search}`, 301);
  }
  return NextResponse.next();
}
