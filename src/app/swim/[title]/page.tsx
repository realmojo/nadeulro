import {
  placeDetailMetadata,
  PlaceDetailRoute,
} from "@/components/place/place-route";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ title: string }> };

export function generateMetadata(props: Props) {
  return placeDetailMetadata("swim", props);
}

export default function Page(props: Props) {
  return <PlaceDetailRoute category="swim" props={props} />;
}
