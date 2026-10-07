"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/motion";
import { useMediaQuery } from "@/lib/media";
import {
  detectKind,
  MAX_FILE_BYTES,
  readDocument,
  readFileAsDataUrl,
} from "@/lib/ocr";
import { pickFromGoogleDrive } from "@/lib/googleDrive";
import {
  buildSampleScreenshot,
  dataUrlToFile,
  SAMPLE_FILE_NAME,
  SAMPLE_TEXT,
} from "@/lib/sampleScreenshot";
import { sound } from "@/lib/sound";
import type {
  CheckResponse,
  HistoryItem,
  Mode,
  Phase,
  RecentResponse,
  UploadState,
} from "@/lib/types";
import { HistoryDrawer } from "./HistoryDrawer";
import { HomeScreen } from "./HomeScreen";
import { ReadingScreen } from "./ReadingScreen";
import { ResultScreen } from "./ResultScreen";
import { ScanScreen } from "./ScanScreen";
import { TopBar } from "./TopBar";

const STATUS_LINES = [
  "Reading it carefully…",
  "Looking for pressure, fees and requests for codes…",
  "Checking the links and who sent it…",
  "Settling on a verdict…",
];

function excerpt(text: string, length = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= length ? clean : `${clean.slice(0, length).trimEnd()}…`;
}

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

export interface CheckerProps {
  initialRecent: RecentResponse;
  live: { nemotron: boolean; tavily: boolean; model: string };
  google: { apiKey: string | null; clientId: string | null };
}

export function Checker({ initialRecent, live, google }: CheckerProps) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("demo");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentResponse>(initialRecent);
  const [helpful, setHelpful] = useState(false);
  const [reported, setReported] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [upload, setUpload] = useState<UploadState | null>(null);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [readLabel, setReadLabel] = useState("Preparing the reader…");
  const [links, setLinks] = useState<string[]>([]);
  const [qr, setQr] = useState<string | undefined>(undefined);
  const [readError, setReadError] = useState<string | null>(null);
  const [readNote, setReadNote] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [driveBusy, setDriveBusy] = useState(false);

  const timers = useRef<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const modeRef = useRef<Mode>("demo");
  const sampleRef = useRef(false);
  const reduced = usePrefersReducedMotion();
  const isTouch = useMediaQuery("(pointer: coarse)");
  const liveAvailable = live.nemotron || live.tavily;
  const driveEnabled = Boolean(google.apiKey && google.clientId);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const refreshRecent = useCallback(async () => {
    try {
      const response = await fetch("/api/checks?limit=6", { cache: "no-store" });
      if (response.ok) setRecent((await response.json()) as RecentResponse);
    } catch {
      /* keeping the previous list is fine */
    }
  }, []);

  const pushHistory = useCallback((payload: CheckResponse, message: string) => {
    setHistory((current) => {
      const entry: HistoryItem = {
        id: payload.id,
        at: new Date().toISOString(),
        verdict: payload.verdict,
        trustScore: payload.trustScore,
        category: payload.category,
        excerpt: excerpt(message),
        text: message,
        result: payload,
      };
      const deduped = current.filter(
        (item) => !(item.id === entry.id && item.text === entry.text),
      );
      return [entry, ...deduped].slice(0, 5);
    });
  }, []);

  const scrollTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [reduced]);

  const runCheck = useCallback(
    async (input: string, nextMode: Mode) => {
      const value = input.trim();
      if (value.length < 8) {
        setError("Paste a little more of the message so there is something to read.");
        textareaRef.current?.focus();
        return;
      }

      clearTimers();
      setError(null);
      setText(value);
      setResult(null);
      setRevealed(0);
      setStatusIndex(0);
      setHelpful(false);
      setReported(false);
      setHistoryOpen(false);
      setPhase("scanning");
      sound.startHum();
      scrollTop();

      try {
        const [payload] = await Promise.all([
          fetch("/api/check", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text: value, mode: nextMode }),
          }).then(async (response) => {
            const json = (await response.json()) as CheckResponse & { error?: string };
            if (!response.ok) throw new Error(json.error ?? "That check did not go through.");
            return json;
          }),
          new Promise((resolve) => window.setTimeout(resolve, 600)),
        ]);

        setResult(payload);
        pushHistory(payload, value);

        const signals = payload.signals;
        const per = signals.length > 0 ? Math.max(280, Math.round(1800 / signals.length)) : 0;
        signals.forEach((_, index) => {
          later(560 + index * per, () => {
            setRevealed(index + 1);
            sound.pop(index);
          });
        });
        const revealEnd = 560 + signals.length * per;

        later(680, () => setStatusIndex(1));
        later(1280, () => setStatusIndex(2));
        later(1780, () => setStatusIndex(3));
        later(Math.max(2150, revealEnd + 480), () => {
          sound.stopHum();
          sound.verdict(payload.verdict);
          setPhase("result");
          void refreshRecent();
        });
      } catch (caught) {
        sound.stopHum();
        setError(caught instanceof Error ? caught.message : "That check did not go through.");
        setPhase(upload ? "reading" : "idle");
      }
    },
    [clearTimers, later, pushHistory, refreshRecent, scrollTop, upload],
  );

  const clearUpload = useCallback(() => {
    setUpload(null);
    setReading(false);
    setProgress(0);
    setLinks([]);
    setQr(undefined);
    setReadError(null);
    setReadNote(null);
    sampleRef.current = false;
  }, []);

  const goHome = useCallback(
    (focusInput = true) => {
      clearTimers();
      sound.stopHum();
      setPhase("idle");
      setResult(null);
      setRevealed(0);
      setHistoryOpen(false);
      clearUpload();
      scrollTop();
      if (focusInput) {
        window.setTimeout(() => textareaRef.current?.focus(), 280);
      }
    },
    [clearTimers, clearUpload, scrollTop],
  );

  /** Reads an attached image or PDF entirely in the browser. */
  const handleFiles = useCallback(
    async (input: File | FileList | null) => {
      const file = input instanceof File ? input : input && input.length > 0 ? input[0] : null;
      if (!file) return;

      if (file.size > MAX_FILE_BYTES) {
        sound.tick();
        setError("That file is over 10 MB. Try a smaller screenshot or a shorter PDF.");
        return;
      }

      const kind = detectKind(file);
      if (!kind) {
        sound.tick();
        setError("I can read photos and PDFs. Try a screenshot, a photo or a PDF.");
        return;
      }

      sound.tick();
      clearTimers();
      setError(null);
      setReadError(null);
      setReadNote(null);
      setLinks([]);
      setQr(undefined);
      setProgress(0);
      setReadLabel("Preparing the reader…");
      setReading(true);
      setText("");

      const dataUrl = kind === "image" ? await readFileAsDataUrl(file).catch(() => "") : "";
      setUpload({
        name: file.name || (kind === "pdf" ? "document.pdf" : "screenshot.png"),
        size: file.size,
        type: file.type,
        dataUrl,
        kind,
        sample: sampleRef.current,
      });
      setPhase("reading");
      scrollTop();

      try {
        const doc = await readDocument(file, (value, label) => {
          setProgress(value);
          setReadLabel(label);
        });

        let extracted = doc.text;
        if (
          sampleRef.current &&
          (extracted.replace(/\s+/g, " ").length < 90 || !/selected/i.test(extracted))
        ) {
          extracted = SAMPLE_TEXT;
          setReadNote("The wording in the image was faint, so I used the sample text.");
        }

        const extras = [...(doc.qr ? [doc.qr] : []), ...doc.links].filter(
          (link) => link.length > 3 && !extracted.includes(link),
        );
        const finalText = extras.length > 0 ? `${extracted}\n\n${extras.join("\n")}` : extracted;

        setText(finalText);
        setLinks(doc.links);
        setQr(doc.qr);

        if (finalText.trim().length < 8) {
          setReadError("I couldn't read that. Try a clearer screenshot.");
        } else {
          sound.pop(0);
        }
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "";
        setReadError(
          /load/i.test(message)
            ? "The reader could not be loaded. Check your connection, or type the message below."
            : "I couldn't read that. Try a clearer screenshot.",
        );
      } finally {
        setReading(false);
        sampleRef.current = false;
      }
    },
    [clearTimers, scrollTop],
  );

  const handleSample = useCallback(async () => {
    const dataUrl = buildSampleScreenshot();
    if (!dataUrl) {
      setError("The sample could not be drawn in this browser.");
      return;
    }
    sampleRef.current = true;
    try {
      const file = await dataUrlToFile(dataUrl, SAMPLE_FILE_NAME);
      await handleFiles(file);
    } catch {
      sampleRef.current = false;
      setError("The sample could not be loaded.");
    }
  }, [handleFiles]);

  const handleDrive = useCallback(async () => {
    if (!google.apiKey || !google.clientId) return;
    try {
      setDriveBusy(true);
      const file = await pickFromGoogleDrive(google.apiKey, google.clientId);
      await handleFiles(file);
    } catch (caught) {
      const cancelled = caught instanceof Error && caught.message === "cancelled";
      if (!cancelled) {
        setError("Google Drive could not open that. Try the photo button instead.");
      }
    } finally {
      setDriveBusy(false);
    }
  }, [google.apiKey, google.clientId, handleFiles]);

  const handleExample = useCallback(
    (value: string) => {
      sound.tick();
      clearUpload();
      void runCheck(value, modeRef.current);
    },
    [clearUpload, runCheck],
  );

  const handleSubmit = useCallback(() => {
    sound.tick();
    void runCheck(text, modeRef.current);
  }, [runCheck, text]);

  const handleModeChange = useCallback((next: Mode) => {
    setMode(next);
    modeRef.current = next;
  }, []);

  const openHistoryItem = useCallback(
    (item: HistoryItem) => {
      clearTimers();
      sound.stopHum();
      setText(item.text);
      setResult(item.result);
      setRevealed(item.result.signals.length);
      setStatusIndex(STATUS_LINES.length - 1);
      setHelpful(false);
      setReported(false);
      setPhase("result");
      setHistoryOpen(false);
      scrollTop();
    },
    [clearTimers, scrollTop],
  );

  const sendFeedback = useCallback(
    (kind: "helpful" | "report") => {
      if (!result?.id) return;
      if (kind === "helpful") setHelpful(true);
      else setReported(true);
      sound.tick();
      void fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: result.id, helpful: kind === "helpful" }),
      }).catch(() => undefined);
    },
    [result],
  );

  // Esc closes the drawer first, then walks back a screen.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (historyOpen) {
        setHistoryOpen(false);
        return;
      }
      if (phase !== "idle") goHome();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen, phase, goHome]);

  // The whole page accepts dropped images and PDFs.
  useEffect(() => {
    let depth = 0;
    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth += 1;
      setDragActive(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onDragLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragActive(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragActive(false);
      void handleFiles(event.dataTransfer?.files ?? null);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [handleFiles]);

  // A screenshot pasted straight from the clipboard.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      const image = files.find((file) => file.type.startsWith("image/"));
      if (!image) return;
      event.preventDefault();
      void handleFiles(image);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  const uploadSource = upload ? { kind: upload.kind, name: upload.name } : null;

  const pickFile = useCallback(() => {
    galleryRef.current?.click();
  }, []);

  const takePhoto = useCallback(() => {
    cameraRef.current?.click();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <TopBar
        phase={phase}
        onHome={() => goHome()}
        onBack={() => goHome()}
        mode={mode}
        onModeChange={handleModeChange}
        liveAvailable={liveAvailable}
        onOpenHistory={() => {
          sound.tick();
          setHistoryOpen(true);
        }}
        historyCount={history.length}
      />

      {phase === "idle" ? (
        <HomeScreen
          text={text}
          onTextChange={setText}
          onSubmit={handleSubmit}
          onExample={handleExample}
          onFiles={(files) => void handleFiles(files)}
          onPickFile={pickFile}
          onTakePhoto={takePhoto}
          onDrive={() => void handleDrive()}
          onSample={() => void handleSample()}
          driveEnabled={driveEnabled}
          showCamera={isTouch}
          error={error}
          recent={recent}
          mode={mode}
          liveAvailable={liveAvailable}
          liveModel={live.model}
          textareaRef={textareaRef}
        />
      ) : null}

      {phase === "reading" && upload ? (
        <ReadingScreen
          upload={upload}
          reading={reading}
          progress={progress}
          label={readLabel}
          text={text}
          links={links}
          qr={qr}
          error={readError}
          note={readNote}
          onTextChange={setText}
          onCheck={() => void runCheck(text, modeRef.current)}
          onRemove={() => {
            setText("");
            goHome();
          }}
          onReplace={() => {
            clearUpload();
            setPhase("idle");
            window.setTimeout(() => {
              const input = document.querySelector<HTMLInputElement>('input[type="file"]');
              input?.click();
            }, 320);
          }}
        />
      ) : null}

      {phase === "reading" && !upload ? (
        <main className="mx-auto w-full max-w-3xl px-6 py-20">
          <p className="m-0 text-[15px] leading-relaxed text-ink-soft">
            Nothing here to read yet. Choose a photo, a screenshot or a PDF to start.
          </p>
          <button
            type="button"
            onClick={() => goHome()}
            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-[14.5px] font-medium text-on-primary shadow-soft"
          >
            Back to home
          </button>
        </main>
      ) : null}

      {phase === "scanning" ? (
        <ScanScreen
          text={text}
          signals={result?.signals ?? []}
          revealed={revealed}
          statusIndex={statusIndex}
          statusLine={STATUS_LINES[statusIndex]}
          onCancel={() => goHome()}
        />
      ) : null}

      {phase === "result" && result ? (
        <ResultScreen
          result={result}
          text={text}
          recent={recent}
          reduced={reduced}
          source={uploadSource}
          onAnother={() => {
            setText("");
            goHome();
          }}
          onHome={() => goHome(false)}
          onFeedback={sendFeedback}
          helpful={helpful}
          reported={reported}
        />
      ) : null}

      {phase === "result" && !result ? (
        <main className="mx-auto w-full max-w-3xl px-6 py-20">
          <p className="m-0 text-[15px] text-ink-soft">
            That result is no longer available. Start a new check whenever you are ready.
          </p>
        </main>
      ) : null}

      {dragActive ? (
        <div
          className="pointer-events-none fixed inset-0 z-[45] grid place-items-center bg-mist/70 p-6 backdrop-blur-sm"
          aria-hidden="true"
        >
          <div className="drop-glow grid w-full max-w-xl place-items-center rounded-card border-2 border-dashed border-safe/70 bg-card/80 px-8 py-16 text-center shadow-lift">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-safe/25 text-safe-deep">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 4.5v11M7.5 11L12 15.5 16.5 11"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 17.5v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <p className="m-0 mt-5 font-display text-[24px] font-semibold text-ink">Drop it here</p>
            <p className="m-0 mt-2 text-[14px] text-ink-soft">
              A photo, a screenshot or a PDF, up to 10 MB. It never leaves your device.
            </p>
          </div>
        </div>
      ) : null}

      {phase !== "idle" ? (
        <button
          type="button"
          onClick={() => {
            sound.back();
            goHome();
          }}
          className="fab fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3.5 text-[13.5px] font-medium text-on-primary shadow-lift sm:bottom-7 sm:right-7 sm:px-5 sm:text-[14.5px]"
          aria-label="New check"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 5.5v13M5.5 12h13"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
          <span className="hidden sm:inline">New check</span>
        </button>
      ) : null}

      <HistoryDrawer
        open={historyOpen}
        items={history}
        onClose={() => setHistoryOpen(false)}
        onOpenItem={openHistoryItem}
      />

      {driveBusy ? (
        <p className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-card/90 px-4 py-2 text-[13px] text-ink-soft shadow-soft">
          Opening Google Drive…
        </p>
      ) : null}
    </div>
  );
}
