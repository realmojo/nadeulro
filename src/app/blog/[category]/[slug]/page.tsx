import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPinned } from "lucide-react";
import { marked } from "marked";

import { PostCard } from "@/components/blog/post-card";
import {
  blogCategoryLabel,
  blogCategoryPath,
  blogCategoryColor,
  blogPostPath,
  type BlogCategory,
} from "@/lib/blog";
import { fetchPost, fetchPosts, fetchAllPublished } from "@/lib/blog-server";
import { CATEGORIES, isPlaceCategory } from "@/lib/places";
import { siteConfig } from "@/lib/site";

export const revalidate = 600;
export const dynamicParams = true;

type Props = { params: Promise<{ category: string; slug: string }> };

marked.setOptions({ gfm: true, breaks: false });

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export async function generateStaticParams() {
  try {
    const posts = await fetchAllPublished();
    return posts.map((p) => ({ category: p.category, slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isPlaceCategory(category)) return {};
  const post = await fetchPost(category, decodeURIComponent(slug)).catch(() => null);
  if (!post) return { title: "글을 찾을 수 없습니다", robots: { index: false } };
  const url = `${siteConfig.url}${blogPostPath(category, post.slug)}`;
  const description =
    post.excerpt ?? post.content.replace(/[#*>\-\n]/g, " ").replace(/\s+/g, " ").slice(0, 120);
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${post.title} | ${siteConfig.name}`,
      description,
      url,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      images: post.coverImage
        ? [post.coverImage.replace(/^http:\/\//, "https://")]
        : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { category, slug } = await params;
  if (!isPlaceCategory(category)) notFound();
  const cat = category as BlogCategory;

  const post = await fetchPost(cat, decodeURIComponent(slug));
  if (!post) notFound();

  const label = blogCategoryLabel(cat);
  const color = blogCategoryColor(cat);
  const meta = CATEGORIES[cat];
  // 표는 모바일에서 가로 스크롤되도록 래핑
  const html = (marked.parse(post.content) as string)
    .replace(/<table>/g, '<div class="blog-table"><table>')
    .replace(/<\/table>/g, "</table></div>");
  const url = `${siteConfig.url}${blogPostPath(cat, post.slug)}`;

  let related = [] as Awaited<ReturnType<typeof fetchPosts>>;
  try {
    related = await fetchPosts({ category: cat, excludeId: post.id, limit: 3 });
  } catch {
    /* 무시 */
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    inLanguage: "ko-KR",
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
    author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/icon.svg` },
    },
    mainEntityOfPage: url,
    ...(post.coverImage
      ? { image: post.coverImage.replace(/^http:\/\//, "https://") }
      : {}),
    articleSection: label,
    keywords: post.tags.join(", "),
  };
  const faqJsonLd =
    post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "블로그", item: `${siteConfig.url}/blog` },
      { "@type": "ListItem", position: 3, name: label, item: `${siteConfig.url}${blogCategoryPath(cat)}` },
      { "@type": "ListItem", position: 4, name: post.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}

      <article className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
        {/* 브레드크럼 (가시) */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="위치">
          <Link href="/blog" className="hover:text-foreground">블로그</Link>
          <span>›</span>
          <Link href={blogCategoryPath(cat)} className="hover:text-foreground">{label}</Link>
        </nav>

        <div className="mt-3 flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
          {post.publishedAt ? (
            <time className="text-sm text-muted-foreground" dateTime={post.publishedAt}>
              {fmtDate(post.publishedAt)}
            </time>
          ) : null}
        </div>

        <h1 className="font-display mt-3 text-3xl font-bold leading-snug md:text-4xl">
          {post.title}
        </h1>
        {post.excerpt ? (
          <p className="mt-3 break-keep text-lg leading-relaxed text-foreground/80">
            {post.excerpt}
          </p>
        ) : null}

        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage.replace(/^http:\/\//, "https://")}
            alt=""
            className="mt-5 w-full rounded-xl object-cover"
          />
        ) : null}

        {/* 본문 */}
        <div className="blog-prose mt-6" dangerouslySetInnerHTML={{ __html: html }} />

        {/* 자주 묻는 질문 (FAQPage 구조화 데이터와 연동) */}
        {post.faq.length ? (
          <section className="mt-10" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="font-display text-2xl font-bold">
              자주 묻는 질문
            </h2>
            <dl className="mt-4 space-y-3">
              {post.faq.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border bg-card p-4 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-lg font-bold">
                    <dt>{f.q}</dt>
                    <span className="text-primary transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <dd className="mt-2.5 break-keep text-base leading-relaxed text-muted-foreground">
                    {f.a}
                  </dd>
                </details>
              ))}
            </dl>
          </section>
        ) : null}

        {post.tags.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        {/* 디렉터리 연결 CTA */}
        <div className="mt-8 rounded-2xl border bg-secondary/40 p-5">
          <p className="break-keep text-base leading-relaxed">
            전국 {label} 위치가 궁금하다면 나들로 지도에서 바로 찾아보세요.
          </p>
          <Link
            href={meta.path}
            className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-persimmon px-5 font-bold text-persimmon-foreground shadow-sm"
          >
            <MapPinned className="size-5" />
            {label} 지도 열기
          </Link>
        </div>

        {/* 목록으로 */}
        <Link
          href={blogCategoryPath(cat)}
          className="mt-8 inline-flex items-center gap-1.5 text-base font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          {label} 글 더 보기
        </Link>
      </article>

      {related.length ? (
        <section className="mx-auto w-full max-w-2xl px-4 pb-12">
          <h2 className="font-display text-xl font-bold md:text-2xl">관련 글</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
