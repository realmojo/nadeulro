/**
 * 블로그 공용 타입·경로 헬퍼. 카테고리는 장소 4종과 동일(토픽 클러스터).
 */
import { CATEGORIES, type PlaceCategory } from "@/lib/places";

export type BlogCategory = PlaceCategory;

export type BlogPost = {
  id: number;
  category: BlogCategory;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string; // markdown
  coverImage: string | null;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string | null;
};

/** 블로그 카테고리 라벨(장소 라벨 재사용) */
export function blogCategoryLabel(c: BlogCategory): string {
  return CATEGORIES[c].label;
}

/** 블로그 카테고리 색(장소 색 재사용) */
export function blogCategoryColor(c: BlogCategory): string {
  return CATEGORIES[c].color;
}

/** /blog/parkgolf */
export function blogCategoryPath(c: BlogCategory): string {
  return `/blog/${c}`;
}

/** /blog/parkgolf/{slug} */
export function blogPostPath(c: BlogCategory, slug: string): string {
  return `/blog/${c}/${encodeURIComponent(slug)}`;
}

/** 카테고리 페이지 SEO 문구 */
export const BLOG_CATEGORY_SEO: Record<
  BlogCategory,
  { title: string; description: string }
> = {
  parkgolf: {
    title: "파크골프 정보·입문 가이드",
    description:
      "파크골프란 무엇인지부터 비용·장비·규칙·매너, 파크골프장 이용 팁까지. 처음 시작하는 어른을 위한 파크골프 이야기를 모았습니다.",
  },
  hotspring: {
    title: "온천 정보·여행 가이드",
    description:
      "전국 온천 추천과 수질·효능, 온천 여행 코스와 이용 팁까지. 몸이 풀리는 온천 나들이를 위한 정보를 정리했습니다.",
  },
  swim: {
    title: "수영장 정보·이용 가이드",
    description:
      "실내·야외 수영장 이용법, 자유수영·강습 정보, 수영 입문 팁까지. 가까운 수영장을 잘 즐기기 위한 이야기를 담았습니다.",
  },
  hiking: {
    title: "등산 코스·초보 가이드",
    description:
      "초보 등산 코스와 준비물, 계절별 산행 팁, 전국 명산 이야기까지. 가볍게 오르는 산부터 이름난 명산까지 안내합니다.",
  },
};
