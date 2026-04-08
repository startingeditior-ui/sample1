import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#059669",
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#059669",
          600: "#047857",
          700: "#065F46",
        },
        // Semantic surface tokens
        "surface-lowest": "#FFFFFF",
        "surface-low": "#F9FAFB",
        "surface-high": "#F3F4F6",
        // Semantic text tokens
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
        "text-outline": "#9CA3AF",
        // Semantic state tokens
        error: "#BA1A1A",
        warning: "#D97706",
        "outline-variant": "#E5E7EB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
} satisfies Config;
