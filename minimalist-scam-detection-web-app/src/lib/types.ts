export type Verdict = "safe" | "careful" | "scam";

export type SignalSeverity = "high" | "medium" | "low";

export type SignalKind =
  | "pressure"
  | "money"
  | "credentials"
  | "channel"
  | "link"
  | "impersonation"
  | "job";

export interface Signal {
  id: string;
  label: string;
  phrase: string;
  start: number;
  end: number;
  weight: number;
  severity: SignalSeverity;
  kind: SignalKind;
  note: string;
}

export interface LinkFinding {
  raw: string;
  host: string;
  risk: "high" | "medium" | "low" | "clean";
  reasons: string[];
  officialFor?: string;
}

export interface SenderSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface SenderReport {
  query: string;
  kind: "domain" | "company" | "phone" | "none";
  status: "verified" | "unknown" | "flagged";
  headline: string;
  detail: string;
  sources: SenderSource[];
  provider: "demo" | "tavily" | "none";
}

export interface ModelOpinion {
  provider: "demo" | "nemotron";
  model: string;
  verdict?: Verdict;
  trustScore?: number;
  headline?: string;
  calmNote?: string;
  reasoning?: string[];
  nextSteps?: string[];
  latencyMs?: number;
}

export interface Analysis {
  verdict: Verdict;
  trustScore: number;
  headline: string;
  category: string;
  categorySlug: string;
  signals: Signal[];
  greenFlags: string[];
  nextSteps: string[];
  links: LinkFinding[];
  sender: SenderReport;
  confidence: number;
  model: ModelOpinion;
}

export interface CheckRecord {
  id: number;
  createdAt: string;
  excerpt: string;
  verdict: Verdict;
  trustScore: number;
  category: string;
  helpfulCount: number;
}

export interface CheckResponse extends Analysis {
  id: number;
  createdAt: string;
  mode: "demo" | "live";
}

export interface RecentResponse {
  checks: CheckRecord[];
  stats: { total: number; safe: number; careful: number; scam: number };
}

export type Phase = "idle" | "reading" | "scanning" | "result";
export type Mode = "demo" | "live";

/** A file the visitor attached, kept in memory only. */
export interface UploadState {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  kind: "image" | "pdf";
  pages?: number;
  sample?: boolean;
}

/** One entry of the in-memory history drawer. */
export interface HistoryItem {
  id: number;
  at: string;
  verdict: Verdict;
  trustScore: number;
  category: string;
  excerpt: string;
  text: string;
  result: CheckResponse;
}

export const VERDICT_META: Record<
  Verdict,
  { title: string; blurb: string; accent: string; tint: string }
> = {
  safe: {
    title: "Looks legitimate",
    blurb: "We found nothing that usually comes with a scam.",
    accent: "#8FD3B0",
    tint: "rgba(143, 211, 176, 0.34)",
  },
  careful: {
    title: "Be careful",
    blurb: "Something about this deserves a second look before you reply.",
    accent: "#F3C67A",
    tint: "rgba(243, 198, 122, 0.36)",
  },
  scam: {
    title: "Very likely a scam",
    blurb: "This hits the patterns we see again and again in real fraud.",
    accent: "#F08A7E",
    tint: "rgba(240, 138, 126, 0.32)",
  },
};
