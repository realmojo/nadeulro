import { CityPage, cityMetadata } from "@/components/place/city-page";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ region: string; city: string }> };

export async function generateMetadata({ params }: Props) {
  const { region, city } = await params;
  return cityMetadata("parkgolf", region, city);
}

export default async function Page({ params }: Props) {
  const { region, city } = await params;
  return <CityPage category="parkgolf" regionRaw={region} cityRaw={city} />;
}
