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
  return <html lang="en"><body>{children}</body></html>;
}
