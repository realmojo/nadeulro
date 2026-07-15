import {
  CategoryMapPage,
  categoryMetadata,
} from "@/components/map/category-page";

export const revalidate = 3600;

export async function generateMetadata() {
  return categoryMetadata("hiking");
}

export default function HikingPage() {
  return <CategoryMapPage category="hiking" />;
}
