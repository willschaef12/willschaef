import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: {
    default: "RealPrice",
    template: "%s | RealPrice"
  },
  description:
    "RealPrice helps shoppers judge whether a product listing is a great deal, fair price, or overpriced using a polished startup-style price analysis experience."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} bg-real-ink font-sans text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
