import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { checks } from "@/db/schema";
import type { CheckRecord, RecentResponse, Verdict } from "./types";

function asVerdict(value: string): Verdict {
  return value === "safe" || value === "careful" || value === "scam" ? value : "careful";
}

export async function getRecentChecks(limit = 6): Promise<RecentResponse> {
  try {
    const rows = await db
      .select({
        id: checks.id,
        createdAt: checks.createdAt,
        excerpt: checks.excerpt,
        verdict: checks.verdict,
        trustScore: checks.trustScore,
        category: checks.category,
        helpfulCount: checks.helpfulCount,
      })
      .from(checks)
      .orderBy(desc(checks.createdAt))
      .limit(limit);

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        safe: sql<number>`count(*) filter (where verdict = 'safe')::int`,
        careful: sql<number>`count(*) filter (where verdict = 'careful')::int`,
        scam: sql<number>`count(*) filter (where verdict = 'scam')::int`,
      })
      .from(checks);

    const records: CheckRecord[] = rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      excerpt: row.excerpt,
      verdict: asVerdict(row.verdict),
      trustScore: row.trustScore,
      category: row.category,
      helpfulCount: row.helpfulCount,
    }));

    return {
      checks: records,
      stats: {
        total: stats?.total ?? 0,
        safe: stats?.safe ?? 0,
        careful: stats?.careful ?? 0,
        scam: stats?.scam ?? 0,
      },
    };
  } catch {
    return { checks: [], stats: { total: 0, safe: 0, careful: 0, scam: 0 } };
  }
}
