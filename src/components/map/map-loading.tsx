/** 라우트 전환 중 즉시 표시되는 지도 로딩 화면 (App Router loading.tsx 공용) */
export function MapLoading({ label = "지도" }: { label?: string }) {
  return (
    <div
      className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-50 flex items-center justify-center bg-background md:top-16 md:bottom-0"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="relative flex size-12 items-center justify-center">
          <span className="absolute inline-flex size-12 animate-ping rounded-full bg-primary/25" />
          <span className="size-9 animate-spin rounded-full border-[3px] border-primary/25 border-t-primary" />
        </span>
        <p className="text-lg font-bold">{label} 여는 중…</p>
        <p className="-mt-1.5 text-base text-muted-foreground">잠시만 기다려 주세요</p>
      </div>
    </div>
  );
}
