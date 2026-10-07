"use client";

import { sound } from "@/lib/sound";

interface UploadRowProps {
  onPickFile: () => void;
  onTakePhoto: () => void;
  onDrive: () => void;
  onSample: () => void;
  showCamera: boolean;
  driveEnabled: boolean;
  driveHint: string | null;
  busy: boolean;
}

function UploadButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        sound.tick();
        onClick();
      }}
      disabled={disabled}
      className="flex items-center gap-2.5 rounded-2xl bg-surface/70 px-4 py-3 text-[13.5px] text-ink shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      {children}
      {label}
    </button>
  );
}

export function UploadRow({
  onPickFile,
  onTakePhoto,
  onDrive,
  onSample,
  showCamera,
  driveEnabled,
  driveHint,
  busy,
}: UploadRowProps) {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        <UploadButton label="Photo or screenshot" onClick={onPickFile} disabled={busy}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="9" cy="10.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M4.5 16.5l4.2-3.8 3.1 2.6 2.6-2.4 4.6 4.1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </UploadButton>

        {showCamera ? (
          <UploadButton label="Take a photo" onClick={onTakePhoto} disabled={busy}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4.5 8.5h2.6l1.3-2h7.2l1.3 2h2.6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13.5" r="3" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </UploadButton>
        ) : null}

        <UploadButton label="From Google Drive" onClick={onDrive} disabled={busy}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9.2 3.5h5.6l6 10.4h-5.6L9.2 3.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M9.2 3.5L3.2 14l2.8 4.8 6-10.4L9.2 3.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M6 18.8h12l2.8-4.9H8.8L6 18.8z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </UploadButton>

        <button
          type="button"
          onClick={() => {
            if (busy) return;
            sound.tick();
            onSample();
          }}
          disabled={busy}
          className="flex items-center gap-2.5 rounded-2xl border border-safe/45 bg-safe/15 px-4 py-3 text-[13.5px] text-ink shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-safe/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3.8l1.7 3.6 3.9.5-2.9 2.7.8 3.9-3.5-2-3.5 2 .8-3.9-2.9-2.7 3.9-.5L12 3.8z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          Try a sample screenshot
        </button>
      </div>

      <p className="m-0 mt-3 text-[12.5px] leading-relaxed text-ink-faint">
        {driveHint ?? "Your files stay on your device. Only the text I read is ever checked."}
      </p>
    </div>
  );
}
