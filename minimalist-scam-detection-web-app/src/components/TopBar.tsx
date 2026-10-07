"use client";

import { useCallback, useState } from "react";
import { sound } from "@/lib/sound";
import type { Mode, Phase } from "@/lib/types";
import { useTheme } from "./ThemeProvider";

interface TopBarProps {
  phase: Phase;
  onHome: () => void;
  onBack: () => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  liveAvailable: boolean;
  onOpenHistory: () => void;
  historyCount: number;
}

function Logo() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] bg-primary text-on-primary shadow-soft">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3.2l6.6 2.9v5.3c0 4-2.7 7.5-6.6 9-3.9-1.5-6.6-5-6.6-9V6.1L12 3.2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9.1 12.1l2 2 4-4.3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-full shadow-soft transition duration-300 sm:h-10 sm:w-10 ${
        active ? "bg-primary text-on-primary" : "bg-surface/80 text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function TopBar({
  phase,
  onHome,
  onBack,
  mode,
  onModeChange,
  liveAvailable,
  onOpenHistory,
  historyCount,
}: TopBarProps) {
  const { theme, toggle } = useTheme();
  const [soundOn, setSoundOn] = useState(true);

  const handleTheme = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      toggle({ x: event.clientX, y: event.clientY });
    },
    [toggle],
  );

  const handleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    sound.setEnabled(next);
    if (next) sound.tick();
  }, [soundOn]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-mist/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={() => {
            sound.tick();
            onHome();
          }}
          className="flex items-center gap-2.5 rounded-full px-1 py-1 transition hover:opacity-80"
          aria-label="Legit home"
        >
          <Logo />
          <span className="hidden font-display text-[19px] font-semibold tracking-[-0.02em] text-ink sm:inline">
            Legit
          </span>
        </button>

        {phase !== "idle" ? (
          <button
            type="button"
            onClick={() => {
              sound.back();
              onBack();
            }}
            className="flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-2 text-[13.5px] text-ink-soft shadow-soft transition duration-300 hover:text-ink"
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
            Back
          </button>
        ) : null}

        <div className="flex-1" />

        <div
          className="flex items-center rounded-full bg-surface/70 p-0.5 shadow-soft"
          role="group"
          aria-label="Check mode"
        >
          {(["demo", "live"] as Mode[]).map((option) => {
            const active = mode === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  sound.tick();
                  onModeChange(option);
                }}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] transition sm:px-3.5 sm:text-[13.5px] ${
                  active ? "bg-primary text-on-primary shadow-soft" : "text-ink-soft hover:text-ink"
                }`}
              >
                {option === "live" ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${liveAvailable ? "bg-safe" : "bg-ink-faint"}`}
                    aria-hidden="true"
                  />
                ) : null}
                {option === "live" ? "Live" : "Demo"}
              </button>
            );
          })}
        </div>

        <IconButton label="History" onClick={onOpenHistory}>
          <span className="relative">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 7v5l3.2 2"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 12a8 8 0 1 1-2.5-5.8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            {historyCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-safe text-[8px] font-semibold text-[#16201c]">
                {historyCount}
              </span>
            ) : null}
          </span>
        </IconButton>

        <IconButton
          label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={handleTheme}
        >
          {theme === "dark" ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M6.1 6.1L4.6 4.6M19.4 19.4l-1.5-1.5M17.9 6.1l1.5-1.5M4.6 19.4l1.5-1.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </IconButton>

        <IconButton label={soundOn ? "Turn sound off" : "Turn sound on"} onClick={handleSound}>
          {soundOn ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4.5 9.5h3l4-3.2v11.4l-4-3.2h-3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M15.4 9.2a4 4 0 0 1 0 5.6M17.9 6.8a7.4 7.4 0 0 1 0 10.4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4.5 9.5h3l4-3.2v11.4l-4-3.2h-3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M15.6 10l4 4M19.6 10l-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          )}
        </IconButton>
      </div>
    </header>
  );
}
