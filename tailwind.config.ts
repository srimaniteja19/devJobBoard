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
