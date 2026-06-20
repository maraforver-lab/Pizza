import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#20251f",
        cream: "#f6f3ea",
        tomato: "#d84b2a",
        leaf: "#54745a",
      },
      boxShadow: {
        card: "0 18px 60px rgba(42, 48, 39, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-newsreader)", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
