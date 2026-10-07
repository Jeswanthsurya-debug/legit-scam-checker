"use client";

import { useMounted } from "@/lib/media";
import type { RecentResponse, Verdict } from "@/lib/types";

const DOT: Record<Verdict, string> = {
  safe: "bg-safe",
  careful: "bg-careful",
  scam: "bg-scam",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function RecentStrip({ data }: { data: RecentResponse }) {
  const mounted = useMounted();

  const { checks, stats } = data;

  return (
    <section className="rounded-card bg-card/80 p-7 shadow-soft backdrop-blur-sm sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 font-display text-[19px] font-semibold tracking-[-0.01em] text-ink">
          Recent checks
        </h2>
        <p className="m-0 text-[13px] text-ink-soft">
          {stats.total > 0 ?
            `${stats.total} checked here · ${stats.scam} flagged as scams`
          : "nothing checked yet"}
        </p>
      </div>

      {checks.length === 0 ? (
        <p className="mt-5 mb-0 text-[14.5px] leading-relaxed text-ink-soft">
          No one has checked anything yet. Paste the first message and it will show up here,
          without your name or any personal detail.
        </p>
      ) : (
        <ul className="m-0 mt-5 flex list-none flex-col gap-1 p-0">
          {checks.map((check) => (
            <li
              key={check.id}
              className="flex items-center gap-3.5 rounded-2xl px-3 py-2.5 transition hover:bg-mist/70"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[check.verdict]}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-[14.5px] text-ink/85">
                {check.excerpt}
              </span>
              <span className="shrink-0 text-[13px] text-ink-faint">{check.category}</span>
              <span className="w-[68px] shrink-0 text-right text-[13px] text-ink-faint">
                {mounted ? timeAgo(check.createdAt) : "just now"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
