"use client";

import { useMediaQuery } from "./media";

/** True when the visitor asked the system to calm motion down. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
