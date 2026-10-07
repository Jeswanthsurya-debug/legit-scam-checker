"use client";

import { useMemo } from "react";
import type { Signal, SignalSeverity } from "@/lib/types";

const MARK_CLASS: Record<SignalSeverity, string> = {
  high: "mark-high",
  medium: "mark-medium",
  low: "mark-safe",
};

const MARK_COLOR: Record<SignalSeverity, string> = {
  high: "#c8574a",
  medium: "#b8862f",
  low: "#4f9e79",
};

interface Segment {
  text: string;
  signal?: Signal;
}

function buildSegments(text: string, signals: Signal[]): Segment[] {
  const sorted = [...signals].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;

  for (const signal of sorted) {
    if (signal.start < cursor || signal.start > text.length) continue;
    if (signal.start > cursor) segments.push({ text: text.slice(cursor, signal.start) });
    segments.push({ text: text.slice(signal.start, signal.end), signal });
    cursor = signal.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

interface MessageCardProps {
  text: string;
  signals: Signal[];
  revealed: number;
  scanning: boolean;
  sweepDuration?: number;
}

export function MessageCard({
  text,
  signals,
  revealed,
  scanning,
  sweepDuration = 2000,
}: MessageCardProps) {
  const segments = useMemo(() => buildSegments(text, signals), [text, signals]);
  const revealedIds = useMemo(
    () => new Set(signals.slice(0, revealed).map((signal) => signal.id)),
    [signals, revealed],
  );
  // On the result screen every bubble pops in, one after another.
  const order = useMemo(
    () => new Map(signals.map((signal, index) => [signal.id, index])),
    [signals],
  );

  return (
    <div className="relative rounded-card bg-card shadow-soft">
      {scanning ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-card">
          <div className="ripple" style={{ ["--sweep" as string]: `${sweepDuration}ms` }} />
        </div>
      ) : null}

      <div className="relative px-6 pb-7 pt-9 sm:px-8 sm:pt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <p className="m-0 text-[13px] text-ink-soft">
            {scanning ? "Reading what you pasted" : "What you pasted"}
          </p>
          {scanning ? (
            <p className="m-0 flex items-center gap-1.5 text-[13px] text-ink-soft">
              <span className="thinking-dot">•</span>
              <span className="thinking-dot" style={{ animationDelay: "180ms" }}>
                •
              </span>
              <span className="thinking-dot" style={{ animationDelay: "360ms" }}>
                •
              </span>
            </p>
          ) : (
            <p className="m-0 text-[13px] text-ink-faint">
              {signals.length === 0 ?
                "nothing flagged"
              : `${signals.length} ${signals.length === 1 ? "phrase" : "phrases"} flagged`}
            </p>
          )}
        </div>

        <p className="m-0 whitespace-pre-wrap text-[15.5px] leading-[1.75] text-ink/85">
          {segments.map((segment, index) => {
            if (!segment.signal) {
              return <span key={index}>{segment.text}</span>;
            }
            const signal = segment.signal;
            const on = revealedIds.has(signal.id);
            const placeBelow = signal.start < 70;
            return (
              <span
                key={signal.id}
                title={on ? signal.note : undefined}
                className={`mark ${on ? `mark-on ${MARK_CLASS[signal.severity]}` : "mark-idle"}`}
              >
                {on ? (
                  <span
                    className="bubble"
                    style={{
                      top: placeBelow ? "calc(100% + 6px)" : undefined,
                      bottom: placeBelow ? "auto" : undefined,
                      backgroundColor: MARK_COLOR[signal.severity],
                      animationDelay: scanning ? undefined : `${260 + (order.get(signal.id) ?? 0) * 110}ms`,
                    }}
                  >
                    {signal.label}
                  </span>
                ) : null}
                {segment.text}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
