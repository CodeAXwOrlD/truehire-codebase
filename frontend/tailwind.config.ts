import type { Config } from "tailwindcss";

// Tokens copied 1:1 from docs/Design.md — do not hand-derive new values per screen.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0C",
        surface: "#121216",
        "surface-card": "#18181D",
        "surface-hover": "#22222A",
        glass: "rgba(255,255,255,0.04)",
        "glass-hover": "rgba(255,255,255,0.08)",
        border: "rgba(255,255,255,0.12)",
        "border-strong": "rgba(255,255,255,0.22)",
        ink: "#FFFFFF",
        "ink-dim": "#C4C4CD",
        "ink-faint": "#8E8E98",
        teal: "#2FBFA8",
        "teal-dim": "#1B7A6B",
        amber: "#F59E0B",
        red: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        card: "12px",
        control: "8px",
      },
    },
    animation: {
      shimmer: "shimmer 1.6s ease-in-out infinite",
      "in": "fade-in 0.15s ease-out",
    },
    keyframes: {
      shimmer: {
        "0%": { transform: "translateX(-100%)" },
        "100%": { transform: "translateX(100%)" },
      },
      "fade-in": {
        "0%": { opacity: "0" },
        "100%": { opacity: "1" },
      },
    },
  },
  safelist: ["animate-shimmer", "animate-in", "fade-in"],
  plugins: [],
};

export default config;
