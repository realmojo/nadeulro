import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase service-role 관리자 클라이언트.
 * 서버 컴포넌트 · Route Handler · 스크립트 전용 — 브라우저 번들에 import 금지.
 * (RLS 우회하므로 클라이언트에 노출되면 안 됨)
 *
 * env(런타임에 읽음): NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 * 팩토리 형태로 둔 이유: tsx 스크립트에서 dotenv 로 .env.local 을 먼저 로드한 뒤
 * 호출해야 하므로, 모듈 로드 시점이 아니라 호출 시점에 env 를 읽어야 한다.
 */
export function createAdminClient(): SupabaseClient {
  const clean = (v: string | undefined) =>
    (v ?? "").trim().replace(/^["']+|["']+$/g, "");
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 없습니다: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
