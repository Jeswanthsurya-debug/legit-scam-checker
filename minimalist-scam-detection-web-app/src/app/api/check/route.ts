import { db } from "@/db";
import { checks } from "@/db/schema";
import { analyseMessage, excerptOf, mergeOpinion } from "@/lib/engine";
import {
  askNemotron,
  guessCompany,
  hasNebius,
  hasTavily,
  verifyCompanyLive,
  verifySenderLive,
} from "@/lib/live";
import type { CheckResponse, SenderReport } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CheckBody {
  text?: unknown;
  mode?: unknown;
}

export async function POST(request: Request) {
  let body: CheckBody;
  try {
    body = (await request.json()) as CheckBody;
  } catch {
    return Response.json({ error: "Could not read that request." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const requestedMode = body.mode === "live" ? "live" : "demo";

  if (text.length < 8) {
    return Response.json(
      { error: "Paste a little more of the message so there is something to read." },
      { status: 400 },
    );
  }

  const started = Date.now();
  let analysis = analyseMessage(text);

  const livePossible = hasNebius() || hasTavily();
  const mode: "demo" | "live" = requestedMode === "live" && livePossible ? "live" : "demo";

  if (mode === "live") {
    const tasks: Promise<void>[] = [];

    const senderTask = (async () => {
      const verified = await verifySenderLive(analysis.sender.query, analysis.sender.kind);
      if (verified) {
        analysis = { ...analysis, sender: verified };
        return;
      }
      if (analysis.categorySlug === "job-offer") {
        const company = guessCompany(text);
        if (company) {
          const companyVerified = await verifyCompanyLive(company);
          if (companyVerified) {
            const merged: SenderReport = companyVerified;
            analysis = { ...analysis, sender: merged };
          }
        }
      }
    })();
    tasks.push(senderTask);

    const modelTask = (async () => {
      const opinion = await askNemotron(text, {
        verdict: analysis.verdict,
        trustScore: analysis.trustScore,
        signals: analysis.signals.map((signal) => signal.label),
        links: analysis.links.map((link) => link.host),
        category: analysis.category,
      });
      analysis = mergeOpinion(analysis, opinion);
    })();
    tasks.push(modelTask);

    await Promise.all(tasks);
  }

  const latencyMs = Date.now() - started;

  try {
    const [row] = await db
      .insert(checks)
      .values({
        messageText: text.slice(0, 4000),
        excerpt: excerptOf(text),
        verdict: analysis.verdict,
        trustScore: analysis.trustScore,
        category: analysis.category,
        categorySlug: analysis.categorySlug,
        headline: analysis.headline,
        confidence: analysis.confidence,
        mode,
        modelName: analysis.model.model,
        latencyMs,
        signals: analysis.signals,
        greenFlags: analysis.greenFlags,
        nextSteps: analysis.nextSteps,
        links: analysis.links,
        sender: analysis.sender,
      })
      .returning({ id: checks.id, createdAt: checks.createdAt });

    const payload: CheckResponse = {
      ...analysis,
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      mode,
    };

    return Response.json(payload);
  } catch {
    const payload: CheckResponse = {
      ...analysis,
      id: 0,
      createdAt: new Date().toISOString(),
      mode,
    };
    return Response.json(payload);
  }
}
