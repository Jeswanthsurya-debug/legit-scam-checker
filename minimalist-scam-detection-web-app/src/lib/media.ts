"use client";

import { useSyncExternalStore } from "react";

const NOOP = () => () => undefined;

/**
 * Reads a media query without touching state inside an effect, so there are no
 * cascading renders and the server snapshot stays honest.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** False during server rendering, true once the client has taken over. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    NOOP,
    () => true,
    () => false,
  );
}
