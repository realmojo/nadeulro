import {
  CategoryMapPage,
  categoryMetadata,
} from "@/components/map/category-page";

export const revalidate = 3600;

export async function generateMetadata() {
  return categoryMetadata("arboretum");
}

export default function ArboretumPage() {
  return <CategoryMapPage category="arboretum" />;
}
