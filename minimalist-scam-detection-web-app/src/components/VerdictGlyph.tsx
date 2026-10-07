"use client";

import type { Verdict } from "@/lib/types";

const ACCENT: Record<Verdict, string> = {
  safe: "#8FD3B0",
  careful: "#F3C67A",
  scam: "#F08A7E",
};

interface VerdictGlyphProps {
  verdict: Verdict;
  reduced: boolean;
  size?: number;
}

/** A small shield: it cracks and glows for a scam, ticks for careful, checks for safe. */
export function VerdictGlyph({ verdict, reduced, size = 46 }: VerdictGlyphProps) {
  const accent = ACCENT[verdict];
  const animationClass = reduced ? "" : verdict === "scam" ? "glyph-glow" : "glyph-pulse";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={animationClass}
      aria-hidden="true"
    >
      <path
        d="M12 3.2l6.6 2.9v5.3c0 4-2.7 7.5-6.6 9-3.9-1.5-6.6-5-6.6-9V6.1L12 3.2z"
        stroke={accent}
        strokeWidth="1.4"
        strokeLinejoin="round"
        className="glyph-draw"
        style={{ ["--d" as string]: "0ms" }}
      />

      {verdict === "safe" ? (
        <path
          d="M8.9 12.1l2.1 2.1 4.1-4.4"
          stroke={accent}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="glyph-draw"
          style={{ ["--d" as string]: "240ms" }}
        />
      ) : null}

      {verdict === "careful" ? (
        <>
          <circle
            cx="12"
            cy="10.6"
            r="1.35"
            fill={accent}
            className="glyph-draw"
            style={{ ["--d" as string]: "240ms" }}
          />
          <path
            d="M12 13.6v3.6"
            stroke={accent}
            strokeWidth="1.8"
            strokeLinecap="round"
            className="glyph-draw"
            style={{ ["--d" as string]: "360ms" }}
          />
        </>
      ) : null}

      {verdict === "scam" ? (
        <path
          d="M12.7 7.2l-2.5 4.2 3 1.5-2.2 4.5"
          stroke={accent}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="glyph-draw"
          style={{ ["--d" as string]: "240ms" }}
        />
      ) : null}
    </svg>
  );
}
