import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Skyroom",
  description: "A Lightroom-inspired aviation and helicopter photo editor built with Next.js."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
