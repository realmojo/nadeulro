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
  const ref = useRef<HTMLModElement>(null);
  // React Strict Mode 의 이펙트 2회 실행에서 같은 <ins> 에 중복 push 방지
  const pushed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || pushed.current) return;

    const push = () => {
      if (pushed.current) return;
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* 광고 차단기 등 — 본문 렌더에는 영향 없음 */
      }
    };

    // display:none 컨테이너(예: 모바일에서 숨긴 PC 패널) 안에서는 요청하지
    // 않는다 — 반응형 광고는 폭 0이면 오류가 나고, 숨긴 광고는 정책 위반.
    if (el.offsetWidth > 0) {
      push();
      return;
    }
    const observer = new ResizeObserver(() => {
      if (el.offsetWidth > 0) {
        push();
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <ins
      ref={ref}
      className={className ? `adsbygoogle ${className}` : "adsbygoogle"}
      style={{ display: "block" }}
      data-ad-client={adsense.client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
