import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: {
    default: "EditForge",
    template: "%s | EditForge"
  },
  description:
    "EditForge turns uploaded clips and one soundtrack into a polished exported video with an FFmpeg-backed auto-edit pipeline."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} bg-forge-obsidian font-sans text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
