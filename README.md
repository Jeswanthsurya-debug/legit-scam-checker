# legit-scam-checker
Legit checks any message, link, offer or screenshot for scams. Highlights the tricks, verifies the sender, and gives a calm verdict. Built with NVIDIA Nemotron on Nebius + Tavily.
# Legit

**Is this message safe?**

Legit checks any message, link, job offer or screenshot and tells you if it looks like a scam. It highlights the tricks inside the message, checks the sender, and gives a calm verdict with what to do next.

Built for the Nebius x NVIDIA Global AI Hackathon.

## The problem

Scam messages are part of daily life: fake internship offers, "parcel stuck" SMS, UPI refund tricks and WhatsApp forwards that look real. Most people have no quick, calm way to check them.

## What Legit does

1. **Paste or upload:** paste a message, or upload a screenshot, photo or PDF (drag and drop, clipboard paste, camera or Drive via the file picker).
2. **Scan:** Legit reads the text and highlights suspicious phrases like urgent pressure, fee requests and unknown links.
3. **Verdict:** a trust dial settles on Safe, Careful or Scam, with the reasons in plain words.
4. **Next steps:** what to do now, plus a friendly warning you can copy and share with family and friends.

## Features

- Text, image and PDF input (OCR runs in the browser)
- Highlighted scam tricks inside your own message
- Live sender and company check
- Trust score with a clear verdict
- Light and dark mode
- Soft sound effects (can be turned off)
- Check history for the current session
- Demo Mode that works with no API keys

## Tech stack

- React + Vite + Tailwind CSS + Framer Motion
- NVIDIA Nemotron on Nebius Token Factory (message analysis)
- Tavily API (live sender and company checks)
- Tesseract.js (image OCR) and pdf.js (PDF text)
- Web Audio API (generated sounds)

## Getting started

```bash
git clone https://github.com/<your-username>/legit-scam-checker.git
cd legit-scam-checker
npm install
npm run dev
```

Open the local URL shown in the terminal. Demo Mode works with no setup.

### Live check mode (optional)

Create a `.env` file in the project root:

```
VITE_NEBIUS_API_KEY=your_nebius_key
VITE_TAVILY_API_KEY=your_tavily_key
```

Restart the dev server, then switch to **Live check** in the top bar.

## Try it

Tap a sample chip such as "Internship offer" or "Parcel SMS", or paste this:

```
Congrats! You are selected for a work-from-home internship. Pay Rs 1,500 registration fee today to confirm.
```

## Privacy

Files are processed in your browser. In Live mode, only the extracted text is sent for analysis.

## Roadmap

- Browser extension and WhatsApp share target
- More languages (Tamil, Hindi, Telugu)
- Community scam reports
- Voice message and call transcript checks

## Team

Built by Jeswanth Surya.

## License

MIT
