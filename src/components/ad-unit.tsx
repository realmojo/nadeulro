"use client";

import { useEffect, useRef } from "react";

import { adsense } from "@/lib/site";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Google AdSense 반응형 디스플레이 광고 1개.
 * 슬롯 ID 는 `adsense.slots`(src/lib/site.ts) 참고.
 */
export function AdUnit({
  slot,
  className,
}: {
  slot: string;
  className?: string;
}) {
  // React Strict Mode 의 이펙트 2회 실행에서 같은 <ins> 에 중복 push 방지
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* 광고 차단기 등 — 본문 렌더에는 영향 없음 */
    }
  }, []);

  return (
    <ins
      className={className ? `adsbygoogle ${className}` : "adsbygoogle"}
      style={{ display: "block" }}
      data-ad-client={adsense.client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
