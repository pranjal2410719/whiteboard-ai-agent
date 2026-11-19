import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/dm-sans/index.css";
import "@fontsource-variable/caveat/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chalkly — Learning studio",
  description: "A personal learning studio where your AI tutor sketches, explains, and works through ideas with you on a live whiteboard.",
  icons: { icon: "/chalkly.svg" },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
