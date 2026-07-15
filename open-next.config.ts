import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext Cloudflare 어댑터 설정. 기본값으로 동작하며, 필요 시
// 캐시/증분정적재생성(ISR) 등을 overrides 로 커스터마이즈한다.
export default defineCloudflareConfig({});
