"use client";

import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { sound } from "@/lib/sound";

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "ghost" | "quiet";
  ariaLabel?: string;
  disabled?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * A calm button with a magnetic hover, a soft press ripple and the interface tick.
 */
export function MagneticButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  ariaLabel,
  disabled = false,
}: MagneticButtonProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const counter = useRef(0);

  const handleMove = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === "quiet") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 5;
    const y = ((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 3;
    setTilt({ x: clamp(x, -6, 6), y: clamp(y, -4, 4) });
  }, [variant]);

  const handleLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const handleDown = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === "quiet" || disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const id = (counter.current += 1);
    setRipples((current) => [
      ...current,
      { id, x: event.clientX - rect.left, y: event.clientY - rect.top },
    ]);
    window.setTimeout(() => setRipples((current) => current.filter((r) => r.id !== id)), 660);
  }, [variant, disabled]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    sound.tick();
    onClick?.();
  }, [disabled, onClick]);

  const base =
    variant === "primary" ?
      "bg-primary text-on-primary shadow-soft hover:shadow-lift"
    : variant === "ghost" ?
      "bg-surface/75 text-ink shadow-soft hover:bg-surface"
    : "text-ink-soft hover:text-ink";

  const style = {
    "--mx": `${tilt.x}px`,
    "--my": `${tilt.y}px`,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onMouseDown={handleDown}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`magnetic ${
        variant === "quiet" ? "" : "rounded-full"
      } ${base} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } transition disabled:hover:translate-y-0 ${className}`}
      style={style}
    >
      {variant === "quiet" ? null : <span className="relative z-10 flex items-center gap-2">{children}</span>}
      {variant === "quiet" ? children : null}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="press-ripple"
          style={{ ["--x" as string]: `${ripple.x}px`, ["--y" as string]: `${ripple.y}px` }}
        />
      ))}
    </button>
  );
}
