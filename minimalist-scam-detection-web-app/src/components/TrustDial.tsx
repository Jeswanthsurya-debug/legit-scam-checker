"use client";

import { useEffect, useMemo, useState } from "react";
import type { Verdict } from "@/lib/types";

const ACCENT: Record<Verdict, string> = {
  safe: "#8FD3B0",
  careful: "#F3C67A",
  scam: "#F08A7E",
};

const DEEP: Record<Verdict, string> = {
  safe: "#4f9e79",
  careful: "#b8862f",
  scam: "#c8574a",
};

function useCountUp(target: number, duration: number, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [target, duration, delay]);

  return value;
}

interface TrustDialProps {
  score: number;
  verdict: Verdict;
  confidence: number;
  reduced?: boolean;
}

export function TrustDial({ score, verdict, confidence, reduced = false }: TrustDialProps) {
  const [settled, setSettled] = useState(false);
  const [washed, setWashed] = useState(false);
  const count = useCountUp(score, 1500, 200);

  useEffect(() => {
    const t1 = window.setTimeout(() => setSettled(true), 120);
    const t2 = window.setTimeout(() => setWashed(true), 720);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const size = 268;
  const center = size / 2;
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const ticks = 56;
  const activeTicks = Math.max(1, Math.round((score / 100) * ticks));

  const tickPositions = useMemo(
    () =>
      Array.from({ length: ticks }, (_, index) => {
        const angle = (-90 + (index / ticks) * 360) * (Math.PI / 180);
        return {
          x: center + Math.cos(angle) * (radius + 26),
          y: center + Math.sin(angle) * (radius + 26),
          on: index < activeTicks,
          delay: 120 + (index / ticks) * 1400,
        };
      }),
    [activeTicks, center, radius, ticks],
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => {
        const angle = (-90 + (index / 9) * 360 + 18) * (Math.PI / 180);
        const distance = radius + 44 + (index % 3) * 10;
        return {
          x: center + Math.cos(angle) * distance,
          y: center + Math.sin(angle) * distance,
          size: 3 + (index % 3),
          delay: index * 190,
        };
      }),
    [center, radius],
  );

  return (
    <div className="relative grid place-items-center">
      <div
        className={`wash ${washed ? "wash-on" : ""}`}
        style={{
          background: `radial-gradient(circle, ${ACCENT[verdict]}55 0%, ${ACCENT[verdict]}22 42%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className={`${reduced ? "" : "dial-entrance"} relative`}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-auto w-full max-w-[268px] overflow-visible"
          role="img"
          aria-label={`Trust score ${score} out of 100`}
        >
          <defs>
            <linearGradient id={`dial-${verdict}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={ACCENT[verdict]} />
              <stop offset="100%" stopColor={DEEP[verdict]} />
            </linearGradient>
          </defs>

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(124, 140, 134, 0.18)"
            strokeWidth={12}
            strokeLinecap="round"
          />

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#dial-${verdict})`}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={settled ? circumference * (1 - score / 100) : circumference}
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: "stroke-dashoffset 1600ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />

          {tickPositions.map((tick, index) => (
            <circle
              key={index}
              cx={tick.x}
              cy={tick.y}
              r={2.1}
              fill={tick.on ? ACCENT[verdict] : "rgba(124, 140, 134, 0.22)"}
              style={{ transition: `fill 420ms ease ${tick.delay}ms` }}
            />
          ))}

          {verdict === "safe" && !reduced
            ? sparkles.map((sparkle, index) => (
                <circle
                  key={`sparkle-${index}`}
                  className="sparkle"
                  cx={sparkle.x}
                  cy={sparkle.y}
                  r={sparkle.size / 2}
                  style={{ ["--d" as string]: `${sparkle.delay}ms` }}
                />
              ))
            : null}
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="m-0 font-display text-[54px] leading-none font-semibold tracking-[-0.03em] text-ink sm:text-[58px]">
              {count}
            </p>
            <p className="mt-2 text-[13px] text-ink-soft">trust score</p>
            <p className="mt-1 text-[12px] text-ink-faint">{confidence}% confidence</p>
          </div>
        </div>
      </div>
    </div>
  );
}
