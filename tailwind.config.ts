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
        real: {
          ink: "#071018",
          panel: "#0d1825",
          card: "#101d2b",
          border: "rgba(148, 163, 184, 0.16)",
          accent: "#4de2a8",
          accentSoft: "#8ff0ca",
          sky: "#7dd3fc",
          copy: "#dfeaf7"
        }
      },
      boxShadow: {
        panel: "0 28px 90px rgba(3, 8, 20, 0.45)",
        glow: "0 0 0 1px rgba(255,255,255,0.05), 0 30px 90px rgba(77,226,168,0.14)"
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
