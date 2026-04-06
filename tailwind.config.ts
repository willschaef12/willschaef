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
        forge: {
          obsidian: "#050816",
          surface: "#0f172a",
          card: "#101826",
          border: "rgba(148, 163, 184, 0.16)",
          accent: "#ff6b2c",
          accentSoft: "#ff9d70",
          electric: "#36d2ff",
          mist: "#c9d6f2"
        }
      },
      boxShadow: {
        panel: "0 22px 70px rgba(3, 8, 20, 0.42)",
        glow: "0 0 0 1px rgba(255,255,255,0.05), 0 30px 90px rgba(255,107,44,0.12)"
      },
      borderRadius: {
        shell: "1.75rem"
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
