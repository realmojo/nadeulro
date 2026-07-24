import {
  RegionPage,
  regionMetadata,
  generateRegionParams,
} from "@/components/place/region-page";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ region: string }> };

export async function generateMetadata({ params }: Props) {
  const { region } = await params;
  return regionMetadata("arboretum", region);
}

export function generateStaticParams() {
  return generateRegionParams("arboretum");
}

export default async function Page({ params }: Props) {
  const { region } = await params;
  return <RegionPage category="arboretum" regionRaw={region} />;
}
