import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cinzel Decorative", "serif"],
        body: ["Cormorant Garamond", "serif"],
        ui: ["DM Sans", "sans-serif"],
      },
      colors: {
        accent: {
          gold: "#c9a96e",
          purple: "#9b6dff",
          pink: "#ff6eb4",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.4,0,0.2,1) forwards",
        "typing": "typing 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        typing: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
