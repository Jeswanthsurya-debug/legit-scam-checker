"use client";

/**
 * A built-in sample "screenshot" drawn on a canvas, so the whole reading flow can
 * be demoed without uploading anything.
 */

export const SAMPLE_FILE_NAME = "sample-job-offer.png";

export const SAMPLE_TEXT = `Talent cell · recruitment

Dear candidate,

Congratulations! Your profile has been selected for a paid remote internship at NVIDIA partner labs. Stipend Rs 42,000 per month, only 2 hours a day.

Interview is not required. Your offer letter is ready on our portal:
https://nemotron-campushiring.work/offer

You only need to pay a one-time documentation fee of Rs 1,499 to activate your offer. This must be completed within 24 hours.

For any questions, message our HR manager on Telegram. Please do not discuss this offer with anyone until joining is confirmed.`;

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawBubble(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxWidth: number,
  text: string,
  options: { font?: string; monospace?: boolean } = {},
): number {
  context.font = options.font ?? "400 27px sans-serif";
  const padding = 26;
  const innerWidth = maxWidth - padding * 2;
  const lines = wrapText(context, text, innerWidth);
  const lineHeight = 40;
  const height = lines.length * lineHeight + padding * 2 - 8;

  context.fillStyle = "#F1F5F2";
  roundRect(context, x, y, maxWidth, height, 22);
  context.fill();

  context.fillStyle = "#2B3A35";
  context.textBaseline = "top";
  lines.forEach((line, index) => {
    context.fillText(line, x + padding, y + padding - 2 + index * lineHeight);
  });

  return height;
}

/** Renders a believable recruitment-scam chat screenshot and returns a PNG data URL. */
export function buildSampleScreenshot(): string {
  const width = 1000;
  const height = 1420;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return "";

  context.fillStyle = "#EEF2EF";
  context.fillRect(0, 0, width, height);

  const cardX = 48;
  const cardY = 48;
  const cardWidth = width - 96;
  const cardHeight = height - 96;

  // chat panel
  context.fillStyle = "#FFFFFF";
  roundRect(context, cardX, cardY, cardWidth, cardHeight, 30);
  context.fill();

  // header band
  context.save();
  roundRect(context, cardX, cardY, cardWidth, cardHeight, 30);
  context.clip();
  context.fillStyle = "#F4F7F5";
  context.fillRect(cardX, cardY, cardWidth, 150);
  context.restore();

  // avatar
  context.fillStyle = "#DCE7E0";
  context.beginPath();
  context.arc(cardX + 88, cardY + 75, 34, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#5B6C65";
  context.font = "600 26px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("HR", cardX + 88, cardY + 76);
  context.textAlign = "left";

  // header text
  context.fillStyle = "#2B3A35";
  context.font = "600 30px sans-serif";
  context.textBaseline = "top";
  context.fillText("Talent cell · recruitment", cardX + 140, cardY + 42);
  context.fillStyle = "#7C8C86";
  context.font = "400 24px sans-serif";
  context.fillText("online · +91 90045 11882", cardX + 140, cardY + 84);

  // messages
  const bubbleX = cardX + 40;
  const bubbleWidth = cardWidth - 160;
  let cursor = cardY + 190;

  const messages: Array<{ text: string; monospace?: boolean }> = [
    { text: "Dear candidate," },
    {
      text:
        "Congratulations! Your profile has been selected for a paid remote internship at NVIDIA partner labs. Stipend Rs 42,000 per month, only 2 hours a day.",
    },
    { text: "Interview is not required. Your offer letter is ready on our portal:" },
    { text: "https://nemotron-campushiring.work/offer", monospace: true },
    {
      text:
        "You only need to pay a one-time documentation fee of Rs 1,499 to activate your offer. This must be completed within 24 hours.",
    },
    {
      text:
        "For any questions, message our HR manager on Telegram. Please do not discuss this offer with anyone until joining is confirmed.",
    },
  ];

  for (const message of messages) {
    if (message.monospace) {
      context.font = "400 26px monospace";
      const lines = wrapText(context, message.text, bubbleWidth - 52);
      const boxHeight = lines.length * 38 + 40;
      context.fillStyle = "#EAF2ED";
      roundRect(context, bubbleX, cursor, bubbleWidth, boxHeight, 22);
      context.fill();
      context.fillStyle = "#25423A";
      context.textBaseline = "top";
      lines.forEach((line, index) => {
        context.fillText(line, bubbleX + 26, cursor + 20 + index * 38);
      });
      cursor += boxHeight + 26;
    } else {
      const used = drawBubble(context, bubbleX, cursor, bubbleWidth, message.text);
      cursor += used + 26;
    }
  }

  context.fillStyle = "#A7B3AE";
  context.font = "400 22px sans-serif";
  context.textAlign = "right";
  context.fillText("Today 09:41", cardX + cardWidth - 46, cursor + 6);
  context.textAlign = "left";

  return canvas.toDataURL("image/png");
}

/** Turns a data URL into a File so the sample runs through the real reading pipeline. */
export async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], name, { type: blob.type || "image/png" });
}
