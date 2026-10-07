"use client";

import { useMediaQuery } from "./media";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Theme choice lives in memory only, as requested: it survives every client-side
 * transition in the session and resets on a fresh load.
 */
let choice: ThemeChoice = "system";

export function getThemeChoice(): ThemeChoice {
  return choice;
}

export function setThemeChoice(next: ThemeChoice): void {
  choice = next;
}

/** Resolves a theme choice to the theme actually shown. */
export function resolveTheme(preference: ThemeChoice, systemDark: boolean): ResolvedTheme {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}

export function useSystemDark(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}
