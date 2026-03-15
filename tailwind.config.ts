import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        skyroom: {
          background: "#0a1018",
          panel: "#121a25",
          border: "rgba(187, 214, 255, 0.12)",
          accent: "#58a6ff",
          accentSoft: "#89c6ff",
          slate: "#9fb0c7"
        }
      },
      boxShadow: {
        chrome: "0 24px 80px rgba(0, 0, 0, 0.45)",
        panel: "0 14px 42px rgba(3, 8, 17, 0.38)"
      },
      borderRadius: {
        chrome: "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
