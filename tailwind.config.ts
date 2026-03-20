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
        background: "#0d0f0e",
        foreground: "#F5F0E8",
        surface: "#141714",
        "surface-raised": "#1c201c",
        flame: {
          DEFAULT: "#F59E0B",
          soft: "#FCD34D",
          dim: "#92400E",
          glow: "rgba(245,158,11,0.15)",
        },
        // Legacy compat
        gold: {
          DEFAULT: "#F59E0B",
          dark: "#92400E",
          muted: "rgba(245,158,11,0.1)",
          border: "rgba(245,158,11,0.25)",
        },
        warm: {
          primary: "#F5F0E8",
          secondary: "#A89F8C",
          tertiary: "#6B6458",
        },
      },
      fontFamily: {
        playfair: ["Playfair Display", "Georgia", "serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        sans: ["var(--font-source-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        card: "12px",
        button: "10px",
        pill: "20px",
      },
      boxShadow: {
        flame: "0 0 24px rgba(245,158,11,0.15)",
        "flame-lg": "0 0 48px rgba(245,158,11,0.12)",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#F5F0E8",
            "--tw-prose-headings": "#F5F0E8",
            "--tw-prose-body": "#A89F8C",
            "--tw-prose-links": "#F59E0B",
            "--tw-prose-bold": "#F5F0E8",
            fontFamily: "var(--font-source-serif), Georgia, serif",
            lineHeight: "1.85",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
