import type { Config } from "tailwindcss";

// Tokens copied 1:1 from docs/Design.md — do not hand-derive new values per screen.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0B",
        surface: "#0F0F11",
        glass: "rgba(255,255,255,0.035)",
        "glass-hover": "rgba(255,255,255,0.06)",
        border: "rgba(255,255,255,0.08)",
        "border-strong": "rgba(255,255,255,0.14)",
        ink: "#F2F2F3",
        "ink-dim": "#9A9AA2",
        "ink-faint": "#5C5C64",
        teal: "#2FBFA8",
        "teal-dim": "#1B7A6B",
        amber: "#D69A45",
        red: "#D9564D",
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
