import { createClient } from "@supabase/supabase-js";

import type { BlogCategory, BlogPost } from "@/lib/blog";

function makeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수가 없습니다");
  return createClient(url, key, { auth: { persistSession: false } });
}

type Row = {
  id: number;
  category: BlogCategory;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  tags: string[] | null;
  published_at: string | null;
  updated_at: string | null;
};

const LIST_COLS =
  "id,category,slug,title,excerpt,cover_image,tags,published_at,updated_at";
const FULL_COLS = `${LIST_COLS},content`;

function toPost(r: Row): BlogPost {
  return {
    id: r.id,
    category: r.category,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content ?? "",
    coverImage: r.cover_image,
    tags: r.tags ?? [],
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
  };
}

/** 게시된 글 목록 (카테고리 필터·개수 제한 가능) — 본문 제외(가벼움) */
export async function fetchPosts(opts?: {
  category?: BlogCategory;
  limit?: number;
  excludeId?: number;
}): Promise<BlogPost[]> {
  const supabase = makeClient();
  let q = supabase
    .from("nadeulro_blog")
    .select(LIST_COLS)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.excludeId) q = q.neq("id", opts.excludeId);
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw new Error(`블로그 목록 조회 실패: ${error.message}`);
  return ((data ?? []) as Row[]).map((r) => toPost({ ...r, content: "" }));
}

/** 단건 (본문 포함) */
export async function fetchPost(
  category: BlogCategory,
  slug: string,
): Promise<BlogPost | null> {
  const supabase = makeClient();
  const { data, error } = await supabase
    .from("nadeulro_blog")
    .select(FULL_COLS)
    .eq("is_published", true)
    .eq("category", category)
    .eq("slug", slug)
    .limit(1);
  if (error) throw new Error(`블로그 단건 조회 실패: ${error.message}`);
  const row = (data ?? [])[0] as Row | undefined;
  return row ? toPost(row) : null;
}

/** 카테고리별 게시글 수 */
export async function blogCounts(): Promise<Record<BlogCategory, number>> {
  const posts = await fetchPosts();
  const c: Record<BlogCategory, number> = {
    parkgolf: 0,
    hotspring: 0,
    swim: 0,
    hiking: 0,
  };
  for (const p of posts) c[p.category] += 1;
  return c;
}

/** 모든 게시글(사이트맵·정적 파라미터용) */
export async function fetchAllPublished(): Promise<BlogPost[]> {
  return fetchPosts();
}
