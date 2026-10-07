"use client";

import type { Signal } from "@/lib/types";
import { MessageCard } from "./MessageCard";

interface ScanScreenProps {
  text: string;
  signals: Signal[];
  revealed: number;
  statusIndex: number;
  statusLine: string;
  onCancel: () => void;
}

export function ScanScreen({
  text,
  signals,
  revealed,
  statusIndex,
  statusLine,
  onCancel,
}: ScanScreenProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-16">
      <div key="scanning" className="page-enter">
        <MessageCard
          text={text}
          signals={signals}
          revealed={revealed}
          scanning
          sweepDuration={2000}
        />

        <div className="mt-8 text-center">
          <p className="m-0 text-[15.5px] text-ink-soft" aria-live="polite">
            {statusLine}
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`h-1.5 w-1.5 rounded-full bg-ink-faint transition-opacity duration-500 ${
                  index <= statusIndex ? "opacity-100" : "opacity-30"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="mt-5 text-[13px] text-ink-faint underline decoration-ink-faint/50 underline-offset-4 transition hover:text-ink"
          >
            Stop and edit the message
          </button>
        </div>
      </div>
    </main>
  );
}
