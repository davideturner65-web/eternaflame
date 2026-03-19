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
        background: "#1C1917",
        foreground: "#E7E0D5",
        gold: {
          DEFAULT: "#C4A869",
          dark: "#A8884A",
          muted: "rgba(196, 164, 105, 0.1)",
          border: "rgba(196, 164, 105, 0.25)",
        },
      },
      fontFamily: {
        playfair: ["Playfair Display", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        button: "10px",
        pill: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
