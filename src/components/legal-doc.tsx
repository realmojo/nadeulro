import type { ReactNode } from "react";

/** 개인정보처리방침·이용약관 등 문서형 페이지의 공통 레이아웃 */
export function LegalDoc({
  updatedAt,
  children,
}: {
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <p className="mb-8 inline-block rounded-full bg-muted px-4 py-1.5 text-base font-medium text-muted-foreground">
        시행일 · {updatedAt}
      </p>
      <div className="space-y-10">{children}</div>
    </article>
  );
}

/** 조항 한 개 (번호 있으면 "제N조") */
export function Clause({
  n,
  title,
  children,
}: {
  n?: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold tracking-tight">
        {n ? (
          <span className="mr-2 text-primary">제{n}조</span>
        ) : null}
        {title}
      </h2>
      <div className="mt-3 space-y-3 break-keep text-lg leading-relaxed text-foreground/85">
        {children}
      </div>
    </section>
  );
}

/** 문서 내 항목 목록 */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-1 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden="true"
            className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60"
          />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
