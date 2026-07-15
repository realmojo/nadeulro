import {
  CategoryMapPage,
  categoryMetadata,
} from "@/components/map/category-page";

export const revalidate = 3600;

export async function generateMetadata() {
  return categoryMetadata("swim");
}

export default function SwimPage() {
  return <CategoryMapPage category="swim" />;
}
