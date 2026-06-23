import Header from "./Header";
import { getLogoUrl } from "@/lib/uploads";

export default async function SiteHeader() {
  const logoUrl = await getLogoUrl();
  return <Header logoUrl={logoUrl} />;
}
