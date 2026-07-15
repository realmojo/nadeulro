import {
  CategoryMapPage,
  categoryMetadata,
} from "@/components/map/category-page";

export const revalidate = 3600;

export async function generateMetadata() {
  return categoryMetadata("hotspring");
}

export default function HotspringPage() {
  return <CategoryMapPage category="hotspring" />;
}
