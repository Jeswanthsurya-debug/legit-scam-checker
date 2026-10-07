"use client";

import { useEffect, useRef } from "react";
import { sound } from "@/lib/sound";
import type { HistoryItem, Verdict } from "@/lib/types";

const DOT: Record<Verdict, string> = {
  safe: "bg-safe",
  careful: "bg-careful",
  scam: "bg-scam",
};

const LABEL: Record<Verdict, string> = {
  safe: "Looks legitimate",
  careful: "Be careful",
  scam: "Very likely a scam",
};

interface HistoryDrawerProps {
  open: boolean;
  items: HistoryItem[];
  onClose: () => void;
  onOpenItem: (item: HistoryItem) => void;
}

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function HistoryDrawer({ open, items, onClose, onOpenItem }: HistoryDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
      role="dialog"
      aria-label="Recent checks in this session"
    >
      <div
        onClick={() => {
          sound.back();
          onClose();
        }}
        className={`drawer-backdrop absolute inset-0 bg-[#0d1411]/35 backdrop-blur-[3px] ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={`drawer-panel absolute right-0 top-0 flex h-full w-[min(384px,88vw)] flex-col bg-card shadow-lift outline-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line/60 px-6 py-5">
          <div>
            <h2 className="m-0 font-display text-[18px] font-semibold text-ink">This session</h2>
            <p className="m-0 mt-1 text-[13px] text-ink-soft">
              {items.length > 0 ? "Your last five checks" : "Nothing checked yet"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.back();
              onClose();
            }}
            aria-label="Close history"
            className="grid h-9 w-9 place-items-center rounded-full bg-surface/80 text-ink-soft shadow-soft transition hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6.5 6.5l11 11M17.5 6.5l-11 11"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <p className="m-0 px-2 py-8 text-[14.5px] leading-relaxed text-ink-soft">
              Checks you run in this session appear here so you can come back to them. They are kept
              in memory only and disappear when you reload.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {items.map((item) => (
                <li key={`${item.id}-${item.at}`}>
                  <button
                    type="button"
                    onClick={() => {
                      sound.tick();
                      onOpenItem(item);
                    }}
                    className="w-full rounded-2xl bg-mist/60 px-4 py-3.5 text-left transition duration-300 hover:bg-mist"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${DOT[item.verdict]}`} aria-hidden="true" />
                      <span className="text-[14.5px] font-medium text-ink">{LABEL[item.verdict]}</span>
                      <span className="ml-auto text-[13px] text-ink-faint">{item.trustScore}</span>
                    </div>
                    <p className="m-0 mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">
                      {item.excerpt}
                    </p>
                    <p className="m-0 mt-1.5 text-[12.5px] text-ink-faint">
                      {item.category} · {timeAgo(item.at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="m-0 border-t border-line/60 px-6 py-4 text-[12.5px] leading-relaxed text-ink-faint">
          History lives in memory for this tab only — nothing about you is stored.
        </p>
      </div>
    </div>
  );
}
