import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1320",
        ink2: "#121B2E",
        paper: "#F7F5F1",
        paperDim: "#EFEBE3",
        steel: "#5B6573",
        steel2: "#8A93A1",
        aluminum: "#C7CCD1",
        amber: "#E8A33D",
        amberDark: "#C8821F",
        navgreen: "#2F8F6F",
        rust: "#B5532C",
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        plate: "0.18em",
      },
      boxShadow: {
        plate: "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.4)",
        card: "0 1px 2px rgba(11,19,32,0.04), 0 4px 16px rgba(11,19,32,0.06)",
      },
      backgroundImage: {
        brushed:
          "repeating-linear-gradient(100deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
