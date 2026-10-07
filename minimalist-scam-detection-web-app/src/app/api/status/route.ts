import { liveStatus } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(liveStatus());
}
