# Legit

A calm second opinion for messages that feel off — job offers, parcel texts, refund calls, links.

Built for the **Nebius × NVIDIA Global AI Hackathon** with Next.js (App Router), Drizzle ORM and
PostgreSQL.

## How it works

1. **Paste a message.** The whole home screen is one large, soft input plus three example chips.
2. **Legit scans it.** A gentle ripple sweeps the card for about two seconds while suspicious
   phrases are highlighted one by one, each with a tiny label bubble ("urgent pressure",
   "asks for a fee", "unknown link").
3. **The trust dial settles.** A soft dial breathes in the middle, fills with the verdict colour and
   settles on a trust score, followed by what stood out, what checks out, what to do next and what we
   could find out about the sender.

## Photos, screenshots and PDFs

Under the main input box:

- **Photo or screenshot** — the device picker (`accept="image/*,application/pdf"`), which on a phone
  also offers the gallery, camera and Drive. On touch devices a second **Take a photo** button uses
  `capture="environment"`.
- **From Google Drive** — opens the real Google Picker when `VITE_GOOGLE_API_KEY` and
  `VITE_GOOGLE_CLIENT_ID` are set. Without them it falls back to the file picker with a hint:
  "Choose Google Drive in the file picker."
- **Drag and drop** anywhere on the page, with a soft glowing "Drop it here" overlay.
- **Paste** — Ctrl/⌘ + V drops a clipboard screenshot straight in.
- **Try a sample screenshot** — draws a fake recruitment-scam chat on a canvas and runs the whole
  reading pipeline, so the flow can be demoed with no upload at all.

Reading happens entirely in the browser: **Tesseract.js** for images, **pdf.js** for PDFs, and
**jsQR** for QR codes (a decoded link becomes a "Link found" chip and is included in the check). The
image is shown as a card with a sweeping light bar while it is read, then the extracted text fades in
below it, editable, before the same scan → highlight → trust dial → verdict flow runs.

Files are capped at 10 MB, JPG / PNG / WEBP / HEIC / PDF are accepted where the browser can decode
them, unreadable files get a friendly "I couldn't read that. Try a clearer screenshot." and can still
be typed by hand. Nothing is uploaded: **your files stay on your device**, and only the extracted
text is ever sent (and only in Live mode).

## The interface

- **Theme** — a sun/moon toggle in the top bar. It follows the system theme by default and remembers
  your choice in memory for the session. Switching uses a 400ms colour transition with a soft
  circular reveal from the toggle (View Transitions API, with a graceful fallback).
- **Navigation** — an always-visible top bar (logo → home, back, demo/live switch, theme, sound,
  history), a floating "New check" button, `Esc` to go back, `Enter` to submit, and a history drawer
  holding your last five checks so any result can be reopened.
- **Sound** — every sound is synthesised in the browser with the Web Audio API: a soft tick on
  buttons and chips, a rising hum while the message is scanned, a pop for each highlighted phrase,
  and calm verdict notes (warm two-note chime for safe, one low note for careful, a gentle
  descending pair for scam). Audio only starts after the first click, sits at about 20% volume, and
  can be switched off in the top bar.
- **Motion** — a breathing glow on the input, drifting shapes behind everything, magnetic buttons
  with press ripples, a spring-settling trust dial with sparkles on a safe verdict, a cracking
  shield glyph and one very soft shake on a scam, staggered result cards and checkmarks that draw
  themselves in. `prefers-reduced-motion` disables the shake, sparkles and sounds.

## Two modes

| Mode | What runs | Needs keys |
| --- | --- | --- |
| Demo (default) | `src/lib/engine.ts` pattern engine (urgency, fee, credential, channel, impersonation and job-scam rules), link analysis (shorteners, lookalike domains, risky endings, IP hosts) and a curated sender / company registry in `src/lib/senders.ts` | none |
| Live check | Everything above, plus a second opinion from **NVIDIA Nemotron on Nebius Token Factory** and live sender / company / domain verification through **Tavily** | yes |

## Optional environment variables

```bash
NEBIUS_API_KEY=            # Nebius Token Factory key
NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1
NEBIUS_MODEL=nvidia/nemotron-3-super-120b-a12b
TAVILY_API_KEY=            # Tavily key for live sender & company checks
```

Without them the toggle still works — it simply falls back to demo mode and says so honestly in the
interface.

## Data

Every check is stored in the `checks` table (message, verdict, trust score, signals, green flags,
next steps, links, sender report, model used, latency). The home page shows the last few checks and
a running count of scams flagged, with no personal identity attached.

```bash
npx drizzle-kit push   # apply the schema
npm run dev            # or: npm run build && npm start
```

## API

- `POST /api/check` — `{ text, mode }` → full analysis
- `GET /api/checks?limit=6` — recent checks and verdict counts
- `POST /api/feedback` — `{ id, helpful }` or `{ id }` to report a scam
- `GET /api/status` — which live integrations are configured
- `GET /api/health` — database ping
