"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { sound } from "@/lib/sound";
import {
  getThemeChoice,
  resolveTheme,
  setThemeChoice,
  useSystemDark,
  type ResolvedTheme,
  type ThemeChoice,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: ResolvedTheme;
  choice: ThemeChoice;
  toggle: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  choice: "system",
  toggle: () => undefined,
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

interface ViewTransitionLike {
  ready: Promise<void>;
}

function startViewTransition(callback: () => void): ViewTransitionLike | null {
  const doc = document as unknown as {
    startViewTransition?: (cb: () => void) => ViewTransitionLike;
  };
  if (typeof doc.startViewTransition !== "function") return null;
  try {
    return doc.startViewTransition(callback);
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>(() => getThemeChoice());
  const systemDark = useSystemDark();
  const theme = resolveTheme(choice, systemDark);
  const skipSyncUntil = useRef(0);

  // Keep the document class in sync with system changes while on "system".
  useEffect(() => {
    const root = document.documentElement;
    const dark = theme === "dark";
    if (Date.now() < skipSyncUntil.current) return;
    if (root.classList.contains("dark") === dark) return;
    root.classList.add("theme-transition");
    root.classList.toggle("dark", dark);
    const timer = window.setTimeout(() => root.classList.remove("theme-transition"), 440);
    return () => window.clearTimeout(timer);
  }, [theme]);

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const root = document.documentElement;
      const next: ResolvedTheme = theme === "dark" ? "light" : "dark";
      const activate = () => {
        root.classList.toggle("dark", next === "dark");
      };

      setThemeChoice(next);
      setChoice(next);

      let reduced = false;
      try {
        reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        reduced = false;
      }

      const point = origin ?? { x: window.innerWidth / 2, y: 44 };
      const transition = origin && !reduced ? startViewTransition(activate) : null;

      if (transition) {
        skipSyncUntil.current = Date.now() + 900;
        void transition.ready
          .then(() => {
            const radius = Math.hypot(
              Math.max(point.x, window.innerWidth - point.x),
              Math.max(point.y, window.innerHeight - point.y),
            );
            root.animate(
              {
                clipPath: [
                  `circle(0px at ${point.x}px ${point.y}px)`,
                  `circle(${radius}px at ${point.x}px ${point.y}px)`,
                ],
              },
              {
                duration: 480,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                pseudoElement: "::view-transition-new(root)",
              } as KeyframeAnimationOptions,
            );
          })
          .catch(() => undefined);
        return;
      }

      root.classList.add("theme-transition");
      activate();
      window.setTimeout(() => root.classList.remove("theme-transition"), 440);
    },
    [theme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, choice, toggle }),
    [theme, choice, toggle],
  );

  // A first real gesture unlocks audio for the whole session.
  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
