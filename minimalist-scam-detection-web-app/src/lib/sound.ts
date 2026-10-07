"use client";

/**
 * Every sound in Legit is synthesised with the Web Audio API — no audio files.
 * The context is created lazily inside a user gesture, everything is low volume
 * (about 20%), and sounds are skipped entirely when the visitor prefers reduced
 * motion or has switched sound off.
 */

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let enabled = true; // remembered in memory for the session
let unlocked = false;

interface HumState {
  oscillators: OscillatorNode[];
  gain: GainNode;
}

let hum: HumState | null = null;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function getContext(): AudioContext | null {
  if (!enabled || prefersReducedMotion()) return null;
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioContext = new Ctor();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.2;
      masterGain.connect(audioContext.destination);
    } catch {
      return null;
    }
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume().catch(() => undefined);
  }
  return audioContext;
}

function ready(): boolean {
  return getContext() !== null;
}

function tone(
  frequency: number,
  startOffset: number,
  duration: number,
  peak: number,
  type: OscillatorType = "sine",
  endFrequency?: number,
): void {
  const ctx = audioContext;
  const master = masterGain;
  if (!ctx || !master) return;

  try {
    const now = ctx.currentTime + startOffset;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + Math.min(0.06, duration * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  } catch {
    /* a failed blip should never break the interface */
  }
}

export const sound = {
  get enabled(): boolean {
    return enabled;
  },

  setEnabled(value: boolean): void {
    enabled = value;
    if (!value) sound.stopHum();
  },

  /** Called from the first real user gesture so playback is allowed. */
  unlock(): void {
    if (unlocked) return;
    unlocked = true;
    getContext();
  },

  /** Soft tick for buttons, chips and toggles. */
  tick(): void {
    if (!ready()) return;
    tone(760, 0, 0.055, 0.09, "sine", 520);
  },

  /** Slightly warmer tick for navigation. */
  back(): void {
    if (!ready()) return;
    tone(520, 0, 0.07, 0.08, "sine", 380);
  },

  /** Gentle pop as each suspicious phrase is highlighted. */
  pop(index: number): void {
    if (!ready()) return;
    const base = 470 + Math.min(index, 6) * 55;
    tone(base, 0, 0.1, 0.1, "sine", base * 1.35);
  },

  /** A slow rising hum that plays while the message is being read. */
  startHum(): void {
    const ctx = getContext();
    const master = masterGain;
    if (!ctx || !master || hum) return;

    try {
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.5);

      const oscillators: OscillatorNode[] = [];
      for (const frequency of [152, 228]) {
        const oscillator = ctx.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.9, now + 2.4);
        oscillator.connect(filter);
        oscillator.start(now);
        oscillators.push(oscillator);
      }
      filter.connect(gain).connect(master);
      hum = { oscillators, gain };
    } catch {
      hum = null;
    }
  },

  stopHum(): void {
    const ctx = audioContext;
    if (!ctx || !hum) return;
    const { oscillators, gain } = hum;
    hum = null;
    try {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      oscillators.forEach((oscillator) => oscillator.stop(now + 0.35));
    } catch {
      /* nothing to clean up */
    }
  },

  /** Warm two-note chime. */
  safe(): void {
    if (!ready()) return;
    tone(587.33, 0, 0.85, 0.12, "sine");
    tone(880, 0.13, 0.95, 0.1, "sine");
    tone(1174.66, 0.13, 0.7, 0.03, "sine");
  },

  /** One soft, low note. */
  careful(): void {
    if (!ready()) return;
    tone(233.08, 0, 0.9, 0.12, "sine");
    tone(174.61, 0.02, 0.95, 0.06, "triangle");
  },

  /** Calm, descending two-note alert — never alarming. */
  scam(): void {
    if (!ready()) return;
    tone(392, 0, 0.42, 0.11, "sine");
    tone(293.66, 0.24, 0.6, 0.1, "sine");
    tone(146.83, 0.24, 0.6, 0.04, "triangle");
  },

  verdict(kind: "safe" | "careful" | "scam"): void {
    if (kind === "safe") sound.safe();
    else if (kind === "careful") sound.careful();
    else sound.scam();
  },
};
