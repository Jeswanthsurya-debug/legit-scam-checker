"use client";

import { useMemo } from "react";
import type { CheckResponse, RecentResponse, Signal, Verdict } from "@/lib/types";
import { VERDICT_META } from "@/lib/types";
import { MagneticButton } from "./MagneticButton";
import { MessageCard } from "./MessageCard";
import { RecentStrip } from "./RecentStrip";
import { TrustDial } from "./TrustDial";
import { VerdictGlyph } from "./VerdictGlyph";

const SEVERITY_DOT: Record<string, string> = {
  high: "bg-scam",
  medium: "bg-careful",
  low: "bg-safe",
};

const STATUS_PILL: Record<string, { bg: string; text: string; label: string }> = {
  verified: { bg: "bg-safe/25", text: "text-safe-deep", label: "verified" },
  unknown: { bg: "bg-mist-deep", text: "text-ink-soft", label: "unverified" },
  flagged: { bg: "bg-scam/22", text: "text-scam-deep", label: "reported" },
};

function SignalList({ signals }: { signals: Signal[] }) {
  const unique = useMemo(() => {
    const seen = new Set<string>();
    return signals.filter((signal) => {
      if (seen.has(signal.label)) return false;
      seen.add(signal.label);
      return true;
    });
  }, [signals]);

  if (unique.length === 0) {
    return (
      <p className="m-0 text-[14.5px] leading-relaxed text-ink-soft">
        Nothing in this message matched a pattern we associate with fraud. That is a good sign, not
        a guarantee.
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {unique.map((signal) => (
        <li key={signal.id} className="flex gap-3.5">
          <span
            className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[signal.severity]}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="m-0 text-[15px] font-medium leading-snug text-ink">{signal.label}</p>
            <p className="m-0 mt-1 text-[13.5px] text-ink-soft">
              “{signal.phrase.trim().slice(0, 46)}
              {signal.phrase.trim().length > 46 ? "…" : ""}”
            </p>
            <p className="m-0 mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{signal.note}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="m-0 mt-5 flex list-none flex-col gap-4 p-0">
      {steps.map((step, index) => (
        <li key={step} className="step-item flex gap-3.5" style={{ ["--i" as string]: index }}>
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-safe/22">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12.6l4.1 4.1L19 7.2"
                stroke="#4f9e79"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="step-check"
                style={{ ["--i" as string]: index }}
              />
            </svg>
          </span>
          <p className="m-0 text-[14.5px] leading-relaxed text-ink/90">{step}</p>
        </li>
      ))}
    </ol>
  );
}

interface ResultScreenProps {
  result: CheckResponse;
  text: string;
  recent: RecentResponse;
  reduced: boolean;
  source?: { kind: "image" | "pdf"; name: string } | null;
  onAnother: () => void;
  onHome: () => void;
  onFeedback: (kind: "helpful" | "report") => void;
  helpful: boolean;
  reported: boolean;
}

export function ResultScreen({
  result,
  text,
  recent,
  reduced,
  source,
  onAnother,
  onHome,
  onFeedback,
  helpful,
  reported,
}: ResultScreenProps) {
  const meta = VERDICT_META[result.verdict];
  const pill = STATUS_PILL[result.sender.status] ?? STATUS_PILL.unknown;
  const shake = result.verdict === "scam" && !reduced ? "soft-shake" : "";

  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 pb-32 pt-5 sm:px-6 sm:pt-6">
      <div
        className="page-wash pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(circle at 50% 14%, ${meta.tint} 0%, rgba(0,0,0,0) 62%)`,
        }}
        aria-hidden="true"
      />

      <div key="result" className="page-enter relative z-10">
        <div className={shake}>
        <section className="relative overflow-hidden rounded-card bg-card shadow-soft">
          <div
            className="panel-wash"
            style={{
              background: `linear-gradient(100deg, ${meta.tint}, rgba(255,255,255,0) 72%)`,
            }}
            aria-hidden="true"
          />
          <div className="relative grid gap-7 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
            <div>
              <p className="m-0 text-[13.5px] text-ink-soft">
                {result.category} · checked just now ·{" "}
                {result.mode === "live" ? "live check" : "demo mode"}
                {source ? ` · from your ${source.kind === "pdf" ? "document" : "screenshot"}` : ""}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <VerdictGlyph verdict={result.verdict} reduced={reduced} />
                <h2
                  className="m-0 font-display text-[clamp(1.85rem,4.6vw,2.9rem)] font-semibold leading-[1.05] tracking-[-0.03em]"
                  style={{ color: meta.accent }}
                >
                  {meta.title}
                </h2>
              </div>

              <p className="m-0 mt-3 max-w-lg text-[16.5px] leading-[1.6] text-ink">
                {result.headline}
              </p>
              <p className="m-0 mt-2 text-[14.5px] leading-relaxed text-ink-soft">{meta.blurb}</p>

              {result.model.calmNote ? (
                <p className="m-0 mt-5 max-w-lg rounded-2xl bg-mist/80 px-5 py-4 text-[14.5px] leading-relaxed text-ink-soft">
                  {result.model.calmNote}
                </p>
              ) : null}

              <p className="m-0 mt-6 text-[13px] leading-relaxed text-ink-faint">
                {result.mode === "live" && result.model.provider === "nemotron" ?
                  `Second opinion from ${result.model.model} on Nebius Token Factory${
                    result.model.latencyMs ? ` · ${(result.model.latencyMs / 1000).toFixed(1)}s` : ""
                  }`
                : result.mode === "live" ?
                  "Live web checks used for the sender, with the offline pattern engine for the message"
                : `Analysed offline by ${result.model.model}`}
              </p>
            </div>

            <TrustDial
              score={result.trustScore}
              verdict={result.verdict}
              confidence={result.confidence}
              reduced={reduced}
            />
          </div>
        </section>

        <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="stagger-item" style={{ ["--i" as string]: 0 }}>
              <MessageCard
                text={text}
                signals={result.signals}
                revealed={result.signals.length}
                scanning={false}
              />
            </div>

            <section
              className="stagger-item rounded-card bg-card p-6 shadow-soft sm:p-8"
              style={{ ["--i" as string]: 1 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="m-0 font-display text-[17px] font-semibold text-ink">
                  About the sender
                </h3>
                <span className={`rounded-full px-3 py-1 text-[12.5px] ${pill.bg} ${pill.text}`}>
                  {pill.label}
                </span>
              </div>

              {result.sender.query ? (
                <p className="m-0 mt-3 break-all text-[13.5px] text-ink-faint">{result.sender.query}</p>
              ) : null}

              <p className="m-0 mt-3 text-[15.5px] font-medium text-ink">{result.sender.headline}</p>
              <p className="m-0 mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                {result.sender.detail}
              </p>

              {result.sender.sources.length > 0 ? (
                <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
                  {result.sender.sources.map((source) => (
                    <li key={source.url} className="text-[13.5px] leading-relaxed">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink underline decoration-ink-faint/60 underline-offset-4 transition hover:text-safe-deep"
                      >
                        {source.title}
                      </a>
                      {source.snippet ? (
                        <span className="block text-ink-soft">{source.snippet}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </div>

          <div className="flex flex-col gap-5 sm:gap-6">
            <section
              className="stagger-item rounded-card bg-card p-6 shadow-soft sm:p-8"
              style={{ ["--i" as string]: 2 }}
            >
              <h3 className="m-0 font-display text-[17px] font-semibold text-ink">What stood out</h3>
              <div className="mt-5">
                <SignalList signals={result.signals} />
              </div>
            </section>

            <section
              className="stagger-item rounded-card bg-card p-6 shadow-soft sm:p-8"
              style={{ ["--i" as string]: 3 }}
            >
              <h3 className="m-0 font-display text-[17px] font-semibold text-ink">
                What to do now
              </h3>
              <StepList steps={result.nextSteps} />
            </section>

            {result.greenFlags.length > 0 ? (
              <section
                className="stagger-item rounded-card bg-card p-6 shadow-soft sm:p-8"
                style={{ ["--i" as string]: 4 }}
              >
                <h3 className="m-0 font-display text-[17px] font-semibold text-ink">
                  What checks out
                </h3>
                <ul className="m-0 mt-5 flex list-none flex-col gap-3 p-0">
                  {result.greenFlags.map((flag) => (
                    <li key={flag} className="flex gap-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="mt-[3px] shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12.8l4.2 4.2L19 7.4"
                          stroke="#8FD3B0"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="m-0 text-[14.5px] leading-relaxed text-ink-soft">{flag}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <MagneticButton onClick={onAnother} className="px-6 py-3 text-[15px] font-medium">
            Check another
          </MagneticButton>
          <MagneticButton
            variant="ghost"
            onClick={onHome}
            className="px-5 py-3 text-[14.5px]"
            ariaLabel="Back to home"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M14.5 5.5L8 12l6.5 6.5"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to home
          </MagneticButton>

          {result.id > 0 ? (
            <button
              type="button"
              onClick={() => onFeedback("helpful")}
              disabled={helpful}
              className={`rounded-full px-5 py-3 text-[14.5px] shadow-soft transition ${
                helpful ? "bg-safe/22 text-safe-deep" : "bg-surface/75 text-ink hover:bg-surface"
              }`}
            >
              {helpful ? "Thanks, noted" : "This was useful"}
            </button>
          ) : null}

          {result.id > 0 && !reported ? (
            <button
              type="button"
              onClick={() => onFeedback("report")}
              className="text-[13.5px] text-ink-faint underline decoration-ink-faint/50 underline-offset-4 transition hover:text-scam-deep"
            >
              Report this as a scam
            </button>
          ) : null}
          {reported ? (
            <span className="text-[13.5px] text-scam-deep">Reported — thank you.</span>
          ) : null}
        </div>

        <div className="mt-12">
          <RecentStrip data={recent} />
        </div>
        </div>
      </div>
    </main>
  );
}
