import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPinned } from "lucide-react";

import { PostCard, BlogCategoryChips } from "@/components/blog/post-card";
import {
  BLOG_CATEGORY_SEO,
  blogCategoryLabel,
  blogCategoryPath,
  type BlogCategory,
} from "@/lib/blog";
import { fetchPosts, blogCounts } from "@/lib/blog-server";
import { CATEGORIES, isPlaceCategory } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 600;
export const dynamicParams = false;

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return (["parkgolf", "hotspring", "swim", "hiking"] as BlogCategory[]).map(
    (category) => ({ category }),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isPlaceCategory(category)) return {};
  const seo = BLOG_CATEGORY_SEO[category];
  const url = `${siteConfig.url}${blogCategoryPath(category)}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: url },
    openGraph: { title: `${seo.title} | ${siteConfig.name}`, description: seo.description, url },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isPlaceCategory(category)) notFound();

  const seo = BLOG_CATEGORY_SEO[category];
  const label = blogCategoryLabel(category);
  const meta = CATEGORIES[category];

  let posts = [] as Awaited<ReturnType<typeof fetchPosts>>;
  let counts = { parkgolf: 0, hotspring: 0, swim: 0, hiking: 0 };
  try {
    [posts, counts] = await Promise.all([
      fetchPosts({ category }),
      blogCounts(),
    ]);
  } catch {
    /* 무시 */
  }

  const url = `${siteConfig.url}${blogCategoryPath(category)}`;
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${label} 블로그`,
    numberOfItems: posts.length,
    itemListElement: posts.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      url: `${siteConfig.url}/blog/${p.category}/${encodeURIComponent(p.slug)}`,
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "블로그", item: `${siteConfig.url}/blog` },
      { "@type": "ListItem", position: 3, name: label, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="flex items-center gap-2">
          <Link
            href="/blog"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted"
            aria-label="블로그 홈으로"
          >
            <ArrowLeft className="size-6" />
          </Link>
          <span className="text-base font-medium text-muted-foreground">블로그</span>
        </div>

        <h1 className="font-display mt-3 text-3xl font-bold md:text-4xl">
          {seo.title}
        </h1>
        <p className="mt-3 max-w-2xl break-keep text-lg leading-relaxed text-muted-foreground">
          {seo.description}
        </p>

        <div className="mt-5">
          <Link
            href={meta.path}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-persimmon px-5 font-bold text-persimmon-foreground shadow-sm"
          >
            <MapPinned className="size-5" />
            {label} 지도에서 찾기
          </Link>
        </div>

        <div className="mt-8">
          <BlogCategoryChips active={category} counts={counts} />
        </div>

        {posts.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border bg-card p-8 text-center">
            <p className="font-display text-xl font-bold">
              {label} 글을 준비하고 있어요
            </p>
            <p className="mt-2 break-keep text-base leading-relaxed text-muted-foreground">
              곧 유용한 {label} 이야기를 올릴 예정입니다. 그동안{" "}
              <Link href={meta.path} className="font-semibold text-primary hover:underline">
                {label} 지도
              </Link>
              에서 가까운 곳을 먼저 찾아보세요.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
