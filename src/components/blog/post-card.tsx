import Link from "next/link";

import {
  blogCategoryLabel,
  blogCategoryPath,
  blogCategoryColor,
  blogPostPath,
  type BlogPost,
} from "@/lib/blog";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 블로그 글 카드 (홈·카테고리·관련글 공용) */
export function PostCard({ post }: { post: BlogPost }) {
  const color = blogCategoryColor(post.category);
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={blogPostPath(post.category, post.slug)} className="block">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage.replace(/^http:\/\//, "https://")}
            alt=""
            loading="lazy"
            className="h-40 w-full object-cover"
          />
        ) : (
          <div
            className="flex h-40 w-full items-center justify-center"
            style={{ backgroundColor: `${color}14` }}
          >
            <span className="font-display text-lg font-bold" style={{ color }}>
              {blogCategoryLabel(post.category)}
            </span>
          </div>
        )}
        <div className="p-5">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {blogCategoryLabel(post.category)}
          </span>
          <h3 className="mt-2.5 break-keep text-lg font-bold leading-snug group-hover:text-primary">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="mt-1.5 line-clamp-2 break-keep text-base leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          ) : null}
          {post.publishedAt ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {fmtDate(post.publishedAt)}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

/** 카테고리 칩 줄 (블로그 홈·카테고리 상단) */
export function BlogCategoryChips({
  active,
  counts,
}: {
  active?: BlogPost["category"];
  counts: Record<BlogPost["category"], number>;
}) {
  const cats: BlogPost["category"][] = [
    "parkgolf",
    "hotspring",
    "swim",
    "hiking",
  ];
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={`flex h-11 items-center rounded-full border-2 px-4 text-base font-semibold transition-colors ${
          !active
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground/80 hover:bg-muted"
        }`}
      >
        전체
      </Link>
      {cats.map((c) => {
        const on = active === c;
        return (
          <Link
            key={c}
            href={blogCategoryPath(c)}
            className={`flex h-11 items-center gap-1.5 rounded-full border-2 px-4 text-base font-semibold transition-colors ${
              on
                ? "border-transparent text-white"
                : "border-border bg-card text-foreground/80 hover:bg-muted"
            }`}
            style={on ? { backgroundColor: blogCategoryColor(c) } : undefined}
          >
            {blogCategoryLabel(c)}
            <span
              className={`text-sm ${on ? "text-white/85" : "text-muted-foreground"}`}
            >
              {counts[c]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
