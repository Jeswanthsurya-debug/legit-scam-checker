import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { checks } from "@/db/schema";

export const dynamic = "force-dynamic";

interface FeedbackBody {
  id?: unknown;
  helpful?: unknown;
}

export async function POST(request: Request) {
  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return Response.json({ error: "Could not read that request." }, { status: 400 });
  }

  const id = typeof body.id === "number" ? body.id : 0;
  if (!id) {
    return Response.json({ error: "No check to update." }, { status: 400 });
  }

  try {
    if (body.helpful === true) {
      const [row] = await db
        .update(checks)
        .set({ helpfulCount: sql`${checks.helpfulCount} + 1` })
        .where(eq(checks.id, id))
        .returning({ helpfulCount: checks.helpfulCount });
      return Response.json({ ok: true, helpfulCount: row?.helpfulCount ?? 0 });
    }

    const [row] = await db
      .update(checks)
      .set({ reportedByUser: true })
      .where(eq(checks.id, id))
      .returning({ reportedByUser: checks.reportedByUser });
    return Response.json({ ok: true, reported: row?.reportedByUser ?? true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
