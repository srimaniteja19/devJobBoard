import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111111",
        edge: "#1e1e1e",
        "edge-hover": "#2e2e2e",
        accent: "#e8ff47",
        "accent-hover": "#d4eb3a",
        "t-primary": "#f0f0f0",
        "t-muted": "#555555",
        "t-faint": "#333333",
        purple: {
          dark: "#1a1528",
          DEFAULT: "#2d2442",
          mid: "#4a3f6b",
          soft: "#7c6ba8",
          glow: "#a78bfa",
        },
        pink: {
          dark: "#2a1520",
          DEFAULT: "#4a2438",
          mid: "#7d3a5c",
          hot: "#ec4899",
          soft: "#f472b6",
        },
      },
      fontFamily: {
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        lg: "6px",
        xl: "6px",
        "2xl": "6px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
