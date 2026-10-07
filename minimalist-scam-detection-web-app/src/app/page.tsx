import { Checker } from "@/components/Checker";
import { liveStatus } from "@/lib/live";
import { getRecentChecks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recent] = await Promise.all([getRecentChecks(6)]);
  const live = liveStatus();

  // Public, client-side credentials for the Google Picker (not secrets).
  const google = {
    apiKey: process.env.VITE_GOOGLE_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? null,
    clientId: process.env.VITE_GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null,
  };

  return <Checker initialRecent={recent} live={live} google={google} />;
}
