import { companyReport, domainReport, normaliseHost } from "./senders";
import type { ModelOpinion, SenderReport, Verdict } from "./types";

const NEBIUS_DEFAULT_BASE = "https://api.tokenfactory.nebius.com/v1";
const NEBIUS_DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const TAVILY_ENDPOINT = "https://api.tavily.com/search";

export function hasNebius(): boolean {
  return Boolean(process.env.NEBIUS_API_KEY);
}

export function hasTavily(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

export function liveStatus() {
  return {
    nemotron: hasNebius(),
    tavily: hasTavily(),
    model: process.env.NEBIUS_MODEL || NEBIUS_DEFAULT_MODEL,
  };
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${url} responded ${response.status}`);
    }
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

interface NemotronPayload {
  verdict?: string;
  trust_score?: number;
  headline?: string;
  calm_note?: string;
  reasoning?: unknown;
  next_steps?: unknown;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function parsePayload(raw: string): NemotronPayload | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as NemotronPayload;
  } catch {
    return null;
  }
}

function normaliseVerdict(value: string | undefined): Verdict | undefined {
  const lower = value?.toLowerCase();
  if (!lower) return undefined;
  if (lower.includes("scam") || lower.includes("fraud")) return "scam";
  if (lower.includes("care") || lower.includes("caution") || lower.includes("suspicious")) return "careful";
  if (lower.includes("safe") || lower.includes("legit") || lower.includes("clean")) return "safe";
  return undefined;
}

/** Ask NVIDIA Nemotron (via Nebius Token Factory) for a calm second opinion. */
export async function askNemotron(
  message: string,
  context: { verdict: Verdict; trustScore: number; signals: string[]; links: string[]; category: string },
): Promise<ModelOpinion> {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) {
    return { provider: "demo", model: "Legit pattern engine v2" };
  }

  const base = process.env.NEBIUS_BASE_URL || NEBIUS_DEFAULT_BASE;
  const model = process.env.NEBIUS_MODEL || NEBIUS_DEFAULT_MODEL;
  const started = Date.now();

  const system = [
    "You are Legit, a calm fraud analyst for ordinary people.",
    "You read a message someone received and judge whether it is a scam.",
    "Rules: sentence case only, never shout, no emoji, no medical or legal claims.",
    "Speak plainly, the way a trusted friend who happens to work in fraud prevention would.",
    "Reply with JSON only, matching:",
    '{"verdict":"safe|careful|scam","trust_score":0-100,"headline":"one calm sentence","calm_note":"one or two sentences","reasoning":["up to four short observations"],"next_steps":["three or four concrete actions"]}',
    "trust_score is trust in the message, 0 means a certain scam.",
  ].join(" ");

  const user = [
    `Message:\n"""\n${message.slice(0, 3500)}\n"""`,
    `Category: ${context.category}`,
    `Pattern engine said: ${context.verdict} (trust ${context.trustScore}/100).`,
    context.signals.length ? `Patterns found: ${context.signals.join(", ")}.` : "Pattern engine found no known scam patterns.",
    context.links.length ? `Links: ${context.links.join(", ")}.` : "No links in the message.",
    "Give your own independent judgement in the JSON.",
  ].join("\n\n");

  try {
    const data = (await fetchJson(
      `${base.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 800,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      },
      14000,
    )) as {
      choices?: { message?: { content?: string } }[];
      model?: string;
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    const payload = parsePayload(content);
    if (!payload) throw new Error("Model returned no parsable JSON");

    const score = typeof payload.trust_score === "number" ? payload.trust_score : undefined;

    return {
      provider: "nemotron",
      model: data.model || model,
      verdict: normaliseVerdict(payload.verdict),
      trustScore: score === undefined ? undefined : Math.max(0, Math.min(100, score)),
      headline: typeof payload.headline === "string" ? payload.headline : undefined,
      calmNote: typeof payload.calm_note === "string" ? payload.calm_note : undefined,
      reasoning: asStringArray(payload.reasoning).slice(0, 4),
      nextSteps: asStringArray(payload.next_steps).slice(0, 4),
      latencyMs: Date.now() - started,
    };
  } catch {
    return {
      provider: "demo",
      model: "Legit pattern engine v2 (live model unavailable)",
      latencyMs: Date.now() - started,
    };
  }
}

const SCAM_WORDS = [
  "scam",
  "phishing",
  "fraud",
  "fraudulent",
  "fake",
  "malware",
  "impersonat",
  "complaint",
  "warning",
  "beware",
  "reported",
  "suspicious",
];

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
}

async function tavilySearch(query: string): Promise<{ answer?: string; results: TavilyResult[] }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { results: [] };
  try {
    const data = (await fetchJson(
      TAVILY_ENDPOINT,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: 5,
          include_answer: true,
          search_depth: "advanced",
        }),
      },
      12000,
    )) as { answer?: string; results?: TavilyResult[] };
    return { answer: data.answer, results: data.results ?? [] };
  } catch {
    return { results: [] };
  }
}

/** Verify a sender domain, phone number or company against the live web. */
export async function verifySenderLive(
  query: string,
  kind: SenderReport["kind"],
): Promise<SenderReport | null> {
  if (!process.env.TAVILY_API_KEY || !query) return null;

  if (kind === "domain") {
    const host = normaliseHost(query);
    const known = domainReport(host);
    if (known.status === "verified") {
      return { query: host, kind: "domain", ...known, provider: "tavily" };
    }
    const search = await tavilySearch(`"${host}" scam OR phishing OR fraud report`);
    const sources = search.results
      .filter((result) => result.url && result.title)
      .slice(0, 3)
      .map((result) => ({
        title: result.title ?? result.url ?? "Source",
        url: result.url ?? "",
        snippet: result.content?.slice(0, 180),
      }));

    if (sources.length === 0) {
      return {
        query: host,
        kind: "domain",
        status: "unknown",
        headline: "Nothing published about this domain",
        detail:
          "Live web search found no scam reports and no record of the brand either. A brand-new domain with no history is still worth treating gently.",
        sources: [],
        provider: "tavily",
      };
    }

    const corpus = `${search.answer ?? ""} ${sources.map((source) => `${source.title} ${source.snippet ?? ""}`).join(" ")}`.toLowerCase();
    const scamHits = SCAM_WORDS.filter((word) => corpus.includes(word));

    if (scamHits.length >= 2 || known.status === "flagged") {
      return {
        query: host,
        kind: "domain",
        status: "flagged",
        headline: known.status === "flagged" ? known.headline : "Reported online",
        detail:
          search.answer?.slice(0, 320) ||
          `Live search found ${sources.length} pages mentioning this domain alongside words like ${scamHits.slice(0, 3).join(", ")}.`,
        sources,
        provider: "tavily",
      };
    }

    return {
      query: host,
      kind: "domain",
      status: "unknown",
      headline: "No scam reports found",
      detail:
        search.answer?.slice(0, 320) ||
        "Live search did not surface scam reports for this domain. That is not a guarantee, only the absence of complaints.",
      sources,
      provider: "tavily",
    };
  }

  if (kind === "phone") {
    const digits = query.replace(/[^\d+]/g, "");
    const search = await tavilySearch(`phone number ${digits} scam calls who called me`);
    const sources = search.results
      .filter((result) => result.url && result.title)
      .slice(0, 3)
      .map((result) => ({ title: result.title ?? "", url: result.url ?? "", snippet: result.content?.slice(0, 180) }));
    const corpus = `${search.answer ?? ""} ${sources.map((s) => `${s.title} ${s.snippet ?? ""}`).join(" ")}`.toLowerCase();
    const flagged = SCAM_WORDS.filter((word) => corpus.includes(word)).length >= 2;

    return {
      query,
      kind: "phone",
      status: flagged ? "flagged" : "unknown",
      headline: flagged ? "This number comes up in complaints" : "No clear complaints about this number",
      detail:
        search.answer?.slice(0, 320) ||
        (sources.length ?
          "Live search found these pages mentioning the number. Read a couple before you decide."
        : "Live search found nothing useful about this number."),
      sources,
      provider: "tavily",
    };
  }

  return null;
}

export function guessCompany(text: string): string | null {
  const patterns = [
    /(?:at|from|join(?:ing)?|with)\s+([A-Z][A-Za-z&.'-]{2,}(?:\s+[A-Z][A-Za-z&.'-]{2,}){0,2})/,
    /(?:position|role|job|internship)\s+at\s+([A-Z][A-Za-z&.'-]{2,}(?:\s+[A-Z][A-Za-z&.'-]{2,}){0,2})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim();
      if (name.split(/\s+/).length > 3) continue;
      if (name.length < 4) continue;
      return name;
    }
  }
  return null;
}

export async function verifyCompanyLive(name: string): Promise<SenderReport | null> {
  if (!process.env.TAVILY_API_KEY || !name) return null;
  const search = await tavilySearch(`"${name}" company careers hiring scam reviews`);
  const sources = search.results
    .filter((result) => result.url && result.title)
    .slice(0, 3)
    .map((result) => ({ title: result.title ?? "", url: result.url ?? "", snippet: result.content?.slice(0, 180) }));

  const corpus = `${search.answer ?? ""} ${sources.map((s) => `${s.title} ${s.snippet ?? ""}`).join(" ")}`.toLowerCase();
  const scamHits = SCAM_WORDS.filter((word) => corpus.includes(word));
  const looksReal = /(careers|linkedin|crunchbase|about us|official site|glassdoor)/.test(corpus);

  if (scamHits.length >= 2) {
    return {
      query: name,
      kind: "company",
      status: "flagged",
      headline: "Complaints mention this name",
      detail:
        search.answer?.slice(0, 320) ||
        `Live search links this name to ${scamHits.slice(0, 3).join(", ")} in several results.`,
      sources,
      provider: "tavily",
    };
  }

  if (looksReal && sources.length > 0) {
    return {
      query: name,
      kind: "company",
      status: "verified",
      headline: "Found a real company",
      detail:
        search.answer?.slice(0, 320) ||
        "Live search found a careers page and public profiles for a company with this name. Confirm the email domain matches before you send anything.",
      sources,
      provider: "tavily",
    };
  }

  return {
    query: name,
    kind: "company",
    status: "unknown",
    headline: "Could not confirm this company",
    detail:
      search.answer?.slice(0, 320) ||
      "Live search did not find a clear company record behind this name. Recruiters without a verifiable employer are best treated as unverified.",
    sources,
    provider: "tavily",
  };
}

export { companyReport };
