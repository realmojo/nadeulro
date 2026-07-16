import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { PostCard, BlogCategoryChips } from "@/components/blog/post-card";
import { fetchPosts, blogCounts } from "@/lib/blog-server";
import { siteConfig } from "@/lib/site";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "나들로 블로그 — 파크골프·온천·수영장·등산 이야기",
  description:
    "파크골프·온천·수영장·등산 나들이에 도움이 되는 입문 가이드, 이용 팁, 코스·후기 이야기를 전해드립니다.",
  alternates: { canonical: `${siteConfig.url}/blog` },
};

export default async function BlogHome() {
  let posts = [] as Awaited<ReturnType<typeof fetchPosts>>;
  let counts = { parkgolf: 0, hotspring: 0, swim: 0, hiking: 0 };
  try {
    [posts, counts] = await Promise.all([fetchPosts({ limit: 30 }), blogCounts()]);
  } catch {
    /* 조회 실패해도 페이지는 뜬다 */
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteConfig.name} 블로그`,
    url: `${siteConfig.url}/blog`,
    description: metadata.description,
    inLanguage: "ko-KR",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        eyebrow="BLOG"
        title="나들로 블로그"
        description="파크골프·온천·수영장·등산 나들이에 도움이 되는 입문 가이드와 이용 팁을 전해드립니다."
      />

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <BlogCategoryChips counts={counts} />

        {posts.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border bg-card p-8 text-center">
            <p className="font-display text-xl font-bold">글을 준비하고 있어요</p>
            <p className="mt-2 break-keep text-base leading-relaxed text-muted-foreground">
              곧 파크골프·온천·수영장·등산 이야기를 올릴 예정입니다. 그동안{" "}
              <Link href="/map" className="font-semibold text-primary hover:underline">
                나들이 지도
              </Link>
              에서 가까운 나들이 스팟을 먼저 찾아보세요.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
