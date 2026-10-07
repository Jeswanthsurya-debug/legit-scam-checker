"use client";

/**
 * Everything here runs in the visitor's browser. No file ever leaves the device:
 * we only ever hand the extracted text to the check that follows.
 */

const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js";
const PDFJS_WORKER_URL =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
const JSQR_URL = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";

const scriptPromises = new Map<string, Promise<void>>();

function loadScript(url: string): Promise<void> {
  const existing = scriptPromises.get(url);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${url}`));
    document.head.appendChild(script);
  });

  scriptPromises.set(url, promise);
  return promise;
}

interface TesseractGlobal {
  recognize: (
    image: unknown,
    lang: string,
    options?: { logger?: (message: { status?: string; progress?: number }) => void },
  ) => Promise<{ data: { text?: string } }>;
}

interface PdfPage {
  getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
}

interface PdfDocument {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
}

interface PdfJsGlobal {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> };
}

type JsQrGlobal = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: Record<string, unknown>,
) => { data: string } | null;

function windowGlobal<T>(key: string): T | undefined {
  return (window as unknown as Record<string, T | undefined>)[key];
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Loads an external script once, used by the readers and the Google Picker. */
export function loadExternalScript(url: string): Promise<void> {
  return loadScript(url);
}

export type ReadProgress = (progress: number, label: string) => void;

export interface ExtractedDoc {
  text: string;
  links: string[];
  pages?: number;
  qr?: string;
}

export type FileKind = "image" | "pdf";

export function detectKind(file: File): FileKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return "pdf";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

function tidy(text: string): string {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"')]+/gi;

export function findLinks(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(URL_PATTERN)) {
    found.add(match[0].replace(/[.,;:!)]+$/, ""));
  }
  return [...found].slice(0, 6);
}

/** Draws the file onto a canvas, scaled down so recognition stays quick. */
async function imageToCanvas(file: File, maxSide: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("That image could not be opened"));
      element.src = url;
    });

    const scale = Math.min(1, maxSide / Math.max(image.width, image.height, 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("That image could not be opened");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function readQrCode(file: File): Promise<string | undefined> {
  try {
    await loadScript(JSQR_URL);
    const jsQr = windowGlobal<JsQrGlobal>("jsQR");
    if (!jsQr) return undefined;
    const canvas = await imageToCanvas(file, 900);
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQr(data, width, height);
    return result?.data?.trim() || undefined;
  } catch {
    return undefined;
  }
}

async function readImage(file: File, onProgress?: ReadProgress): Promise<ExtractedDoc> {
  const [canvas, qr] = await Promise.all([
    imageToCanvas(file, 1800),
    readQrCode(file),
  ]);

  await loadScript(TESSERACT_URL);
  const tesseract = windowGlobal<TesseractGlobal>("Tesseract");
  if (!tesseract) throw new Error("The reader could not be loaded");

  const result = await tesseract.recognize(canvas, "eng", {
    logger: (message) => {
      const progress = typeof message.progress === "number" ? message.progress : 0;
      if (message.status === "recognizing text") {
        onProgress?.(0.35 + progress * 0.65, "Reading your screenshot…");
      } else {
        onProgress?.(Math.min(0.34, progress * 0.34), "Preparing the reader…");
      }
    },
  });

  return {
    text: tidy(result.data.text ?? ""),
    links: findLinks(`${result.data.text ?? ""}\n${qr ?? ""}`),
    qr,
  };
}

async function readPdf(file: File, onProgress?: ReadProgress): Promise<ExtractedDoc> {
  await loadScript(PDFJS_URL);
  const pdfjs = windowGlobal<PdfJsGlobal>("pdfjsLib");
  if (!pdfjs) throw new Error("The reader could not be loaded");

  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  const data = await file.arrayBuffer();
  const document_ = await pdfjs.getDocument({ data }).promise;
  const pages = Math.min(document_.numPages, 8);

  let text = "";
  for (let index = 1; index <= pages; index += 1) {
    const page = await document_.getPage(index);
    const content = await page.getTextContent();
    text += `${content.items.map((item) => item.str ?? "").join(" ")}\n\n`;
    onProgress?.(index / pages, index === 1 ? "Reading your document…" : `Page ${index} of ${pages}…`);
  }

  return { text: tidy(text), links: findLinks(text), pages: document_.numPages };
}

/** Extracts editable text from an image or a PDF, entirely in the browser. */
export async function readDocument(file: File, onProgress?: ReadProgress): Promise<ExtractedDoc> {
  const kind = detectKind(file);
  if (kind === "pdf") return readPdf(file, onProgress);
  return readImage(file, onProgress);
}
