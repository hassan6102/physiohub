import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#123B50", 50: "#EAF1F5", 100: "#CFE0E9", 600: "#123B50", 700: "#0E2F40" },
        secondary: { DEFAULT: "#1D7180", 50: "#E8F3F5", 600: "#1D7180" },
        accent: { DEFAULT: "#36B6A6", 50: "#E9F8F6", 600: "#2A9688" },
        canvas: "#F5F8FA",
        surface: "#FFFFFF",
        ink: "#192D3A",
        muted: "#71818B",
        line: "#E5EDF0",
        danger: "#C8433B",
        warning: "#D98A1F",
        success: "#2A9688",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-cairo)", "system-ui", "sans-serif"],
        arabic: ["var(--font-cairo)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        card: "0 1px 2px rgba(18,59,80,0.04), 0 4px 16px rgba(18,59,80,0.05)",
        pop: "0 12px 40px rgba(18,59,80,0.16)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { "fade-up": "fade-up .35s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
