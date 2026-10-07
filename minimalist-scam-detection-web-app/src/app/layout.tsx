import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Legit — is that message a scam?",
  description:
    "Paste a message, link, job offer or payment text and Legit reads it gently, showing you exactly what feels off and what to do next.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEF2EF" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1411" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeBootstrap = `(function(){try{var d=document.documentElement;var m=window.matchMedia('(prefers-color-scheme: dark)');if(m.matches){d.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-mist text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <ThemeProvider>
          <div className="ambient" aria-hidden="true">
            <span />
            <span />
            <span />
            <span className="float-shape float-shape-a" />
            <span className="float-shape float-shape-b" />
            <span className="float-shape float-shape-c" />
          </div>
          <div className="relative z-10">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
