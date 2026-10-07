"use client";

import { useCallback, useState, type RefObject } from "react";
import { EXAMPLES, SAFE_EXAMPLE } from "@/lib/examples";
import { sound } from "@/lib/sound";
import type { Mode, RecentResponse } from "@/lib/types";
import { MagneticButton } from "./MagneticButton";
import { RecentStrip } from "./RecentStrip";
import { UploadRow } from "./UploadRow";

interface HomeScreenProps {
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  onExample: (text: string) => void;
  onFiles: (files: FileList | null) => void;
  onPickFile: () => void;
  onTakePhoto: () => void;
  onDrive: () => void;
  onSample: () => void;
  driveEnabled: boolean;
  showCamera: boolean;
  error: string | null;
  recent: RecentResponse;
  mode: Mode;
  liveAvailable: boolean;
  liveModel: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function HomeScreen({
  text,
  onTextChange,
  onSubmit,
  onExample,
  onFiles,
  onPickFile,
  onTakePhoto,
  onDrive,
  onSample,
  driveEnabled,
  showCamera,
  error,
  recent,
  mode,
  liveAvailable,
  liveModel,
  textareaRef,
}: HomeScreenProps) {
  const [driveHint, setDriveHint] = useState<string | null>(null);
  const modelShort = liveModel.split("/").pop() ?? liveModel;

  const handleDrive = useCallback(() => {
    if (driveEnabled) {
      onDrive();
      return;
    }
    setDriveHint("Choose Google Drive in the file picker.");
    onPickFile();
  }, [driveEnabled, onDrive, onPickFile]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-14">
      <div key="home" className="page-enter">
        <h1 className="m-0 font-display text-[clamp(2.35rem,6.2vw,4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">
          Got a message that feels off?
        </h1>
        <p className="mt-5 mb-0 max-w-xl text-[16.5px] leading-[1.65] text-ink-soft sm:text-[17px]">
          Paste it below, or drop in a screenshot. Legit reads it the way a patient fraud analyst
          would — pointing at the exact phrases that matter, then telling you what to do next.
        </p>
      </div>

      <div className="input-glow mt-9 rounded-card bg-card p-2.5 sm:mt-10">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (!event.shiftKey || event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Paste it here"
          spellCheck={false}
          aria-label="Paste the message you want checked"
          className="min-h-[150px] w-full resize-none rounded-[19px] bg-transparent px-5 py-5 text-[15.5px] leading-[1.72] text-ink outline-none placeholder:text-ink-faint sm:min-h-[178px] sm:text-[16px]"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-2.5 pt-1 sm:px-3.5">
          <p className="m-0 text-[12.5px] text-ink-faint sm:text-[13px]">
            {text.trim().length > 0 ?
              `${text.trim().length} characters`
            : "Nothing is shared or signed"}
          </p>
          <MagneticButton
            onClick={onSubmit}
            className="px-6 py-3 text-[15px] font-medium"
            ariaLabel="Check this message"
          >
            Check it
          </MagneticButton>
        </div>
      </div>

      <UploadRow
        onPickFile={onPickFile}
        onTakePhoto={onTakePhoto}
        onDrive={handleDrive}
        onSample={onSample}
        showCamera={showCamera}
        driveEnabled={driveEnabled}
        driveHint={driveHint}
        busy={false}
      />

      {error ? <p className="m-0 mt-4 text-[14px] text-scam-deep">{error}</p> : null}

      <div className="mt-7 flex flex-wrap gap-2 sm:gap-2.5">
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            onClick={() => onExample(example.text)}
            className="rounded-full bg-surface/70 px-4 py-2.5 text-[13.5px] text-ink shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-surface sm:text-[14px]"
          >
            {example.chip}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onExample(SAFE_EXAMPLE)}
        className="mt-4 text-[13.5px] text-ink-soft underline decoration-ink-faint/60 underline-offset-4 transition hover:text-ink"
      >
        Curious how a genuine message scores? Try one →
      </button>

      <p className="mt-9 max-w-2xl text-[13px] leading-relaxed text-ink-faint sm:mt-10 sm:text-[13.5px]">
        {mode === "live" ?
          liveAvailable ?
            `Live check is on. NVIDIA ${modelShort} reads the message through Nebius Token Factory, and Tavily verifies the sender, company or domain against the live web.`
          : "Live check is on, but no keys are set in this sandbox, so Legit quietly falls back to the offline pattern engine."
        : "Demo mode runs entirely offline: a pattern engine built from real fraud scripts, plus a curated registry of senders and companies. No API keys needed."}
      </p>

      <div className="mt-12 sm:mt-14">
        <RecentStrip data={recent} />
      </div>

      <p className="mt-12 text-[12.5px] leading-relaxed text-ink-faint sm:mt-14 sm:text-[13px]">
        Built for the Nebius × NVIDIA Global AI Hackathon. Legit gives a second opinion, not a
        verdict you must obey — when money is involved, call the number on your card.
      </p>

      <p className="m-0 mt-6 text-[12.5px] leading-relaxed text-ink-faint">
        Tip: press Ctrl or ⌘ with V to paste a screenshot straight from your clipboard.
        straight from your clipboard.
      </p>
    </main>
  );
}
