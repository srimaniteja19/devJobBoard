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
        "jobs-bg": "var(--jobs-bg)",
        "jobs-card": "var(--jobs-card)",
        "jobs-text": "var(--jobs-text)",
        "jobs-muted": "var(--jobs-text-muted)",
        "jobs-faint": "var(--jobs-text-faint)",
        "jobs-edge": "var(--jobs-edge)",
        "jobs-accent": "var(--jobs-accent)",
        "jobs-accent-hover": "var(--jobs-accent-hover)",
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        edge: "var(--color-edge)",
        "edge-hover": "var(--color-edge-hover)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "on-accent": "var(--color-on-accent)",
        "t-primary": "var(--color-t-primary)",
        "t-muted": "var(--color-t-muted)",
        "t-faint": "var(--color-t-faint)",
        purple: {
          dark: "var(--color-purple-dark)",
          DEFAULT: "var(--color-purple)",
          mid: "var(--color-purple-mid)",
          soft: "var(--color-purple-soft)",
          glow: "var(--color-purple-glow)",
        },
        pink: {
          dark: "var(--color-pink-dark)",
          DEFAULT: "var(--color-pink)",
          mid: "var(--color-pink-mid)",
          hot: "var(--color-pink-hot)",
          soft: "var(--color-pink-soft)",
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
