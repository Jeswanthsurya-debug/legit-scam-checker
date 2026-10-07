import { getRecentChecks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "6", 10);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(20, limitParam)) : 6;
  const data = await getRecentChecks(limit);
  return Response.json(data);
}
