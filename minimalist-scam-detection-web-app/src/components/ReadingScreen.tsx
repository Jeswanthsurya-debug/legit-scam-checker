"use client";

import { formatBytes } from "@/lib/ocr";
import { sound } from "@/lib/sound";
import type { UploadState } from "@/lib/types";
import { MagneticButton } from "./MagneticButton";

interface ReadingScreenProps {
  upload: UploadState;
  reading: boolean;
  progress: number;
  label: string;
  text: string;
  links: string[];
  qr?: string;
  error: string | null;
  note: string | null;
  onTextChange: (value: string) => void;
  onCheck: () => void;
  onRemove: () => void;
  onReplace: () => void;
}

export function ReadingScreen({
  upload,
  reading,
  progress,
  label,
  text,
  links,
  qr,
  error,
  note,
  onTextChange,
  onCheck,
  onRemove,
  onReplace,
}: ReadingScreenProps) {
  const isPdf = upload.kind === "pdf";
  const subject = isPdf ? "document" : "screenshot";
  const canCheck = text.trim().length >= 8;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
      <div key="reading" className="page-enter">
        <h1 className="m-0 font-display text-[clamp(1.9rem,4.6vw,2.7rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
          Reading your {subject}
        </h1>
        <p className="mt-3 mb-0 max-w-xl text-[15.5px] leading-relaxed text-ink-soft">
          {reading ?
            "Pulling the words out on your device. Nothing is uploaded anywhere."
          : "Here is what I found. Tidy it up if anything looks wrong, then check it."}
        </p>

        <div className="relative mt-7 rounded-card bg-card p-3 shadow-soft">
          <button
            type="button"
            onClick={() => {
              sound.back();
              onRemove();
            }}
            aria-label="Remove this file"
            className="absolute right-6 top-6 z-10 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-ink-soft shadow-soft backdrop-blur transition hover:text-ink"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6.5 6.5l11 11M17.5 6.5l-11 11"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="relative overflow-hidden rounded-[18px]">
            {isPdf ? (
              <div className="flex min-h-[190px] flex-col items-center justify-center gap-3 bg-mist/60 px-6 py-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-scam/18 text-scam-deep">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5L14 3.5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path d="M14 3.5V7.5H18" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="m-0 max-w-xs truncate text-[14.5px] font-medium text-ink">
                  {upload.name}
                </p>
                <p className="m-0 text-[13px] text-ink-soft">
                  {upload.pages && upload.pages > 0 ? `${upload.pages} pages · ` : ""}
                  {formatBytes(upload.size)}
                </p>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={upload.dataUrl}
                alt={`Uploaded ${subject} waiting to be read`}
                className="max-h-[40vh] min-h-[190px] w-full bg-mist/60 object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}

            {reading ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="ripple" style={{ ["--sweep" as string]: "1600ms" }} />
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 pb-1">
            <p className="m-0 max-w-full truncate text-[12.5px] text-ink-faint">
              {upload.name} · {formatBytes(upload.size)}
            </p>
            <p className="m-0 text-[12.5px] text-ink-faint">Your files stay on your device.</p>
          </div>
        </div>

        {reading ? (
          <div className="mt-6" aria-live="polite">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist-deep">
              <div
                className="h-full rounded-full bg-safe transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(6, Math.round(progress * 100))}%` }}
              />
            </div>
            <p className="m-0 mt-3 text-[14.5px] text-ink-soft">{label}</p>
          </div>
        ) : null}

        {error ? (
          <div className="fade-up mt-6 rounded-card bg-scam/12 p-6 shadow-soft">
            <p className="m-0 text-[15px] font-medium text-ink">I couldn&apos;t read that.</p>
            <p className="m-0 mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">
              Try a clearer screenshot, or type the message in yourself below.
            </p>
          </div>
        ) : null}

        {!reading ? (
          <div className="fade-up mt-6 rounded-card bg-card p-3 shadow-soft">
            <p className="m-0 px-3 pt-3 text-[13px] text-ink-soft">
              {text.trim().length > 0 ?
                `Pulled from your ${subject} — you can edit it before checking`
              : "Type or paste the message you want checked"}
            </p>

            <textarea
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey || !event.shiftKey)) {
                  event.preventDefault();
                  if (canCheck) onCheck();
                }
              }}
              spellCheck={false}
              aria-label="Text read from your file"
              placeholder="The text I read will appear here…"
              className="mt-2 min-h-[150px] w-full resize-none rounded-[16px] bg-transparent px-4 py-4 text-[15.5px] leading-[1.72] text-ink outline-none placeholder:text-ink-faint"
            />

            {links.length > 0 || qr ? (
              <div className="flex flex-wrap gap-2 px-3 pb-1">
                {links.map((link) => (
                  <span
                    key={link}
                    className="flex max-w-full items-center gap-1.5 rounded-full bg-safe/22 px-3 py-1.5 text-[12.5px] text-safe-deep"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M10.5 13.5a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 0 0-5.7-5.7l-1 1"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.3 2.3a4 4 0 0 0 5.7 5.7l1-1"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="max-w-[220px] truncate">Link found · {link}</span>
                  </span>
                ))}
                {qr && !links.includes(qr) ? (
                  <span className="flex max-w-full items-center gap-1.5 rounded-full bg-mist-deep px-3 py-1.5 text-[12.5px] text-ink-soft">
                    <span className="max-w-[220px] truncate">QR code · {qr}</span>
                  </span>
                ) : null}
              </div>
            ) : null}

            {note ? <p className="m-0 px-3 pb-1 pt-2 text-[12.5px] text-ink-faint">{note}</p> : null}

            <div className="flex flex-wrap items-center gap-3 px-3 pb-3 pt-3">
              <MagneticButton
                onClick={() => {
                  if (canCheck) onCheck();
                }}
                disabled={!canCheck}
                className="px-6 py-3 text-[15px] font-medium"
                ariaLabel="Check the text I read"
              >
                Check it
              </MagneticButton>
              <MagneticButton
                variant="ghost"
                onClick={onReplace}
                className="px-5 py-3 text-[14.5px]"
                ariaLabel="Choose a different file"
              >
                Use a different file
              </MagneticButton>
              <p className="m-0 ml-auto text-[12.5px] text-ink-faint">Only the text is checked.</p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
