import type { Config } from "tailwindcss";

const doughToolsPalette = {
  forest: "#0F3D2E",
  forestDark: "#09291F",
  warmBackground: "#FFF8F1",
  flour: "#F1E6D8",
  card: "#FFFFFF",
  tomato: "#E94B2E",
  ovenGold: "#E8C98A",
  basil: "#3BA66B",
  ink: "#1F1F1F",
  muted: "#6B645D",
} as const;

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: doughToolsPalette.forest,
        "forest-dark": doughToolsPalette.forestDark,
        "warm-background": doughToolsPalette.warmBackground,
        flour: doughToolsPalette.flour,
        card: doughToolsPalette.card,
        tomato: doughToolsPalette.tomato,
        "oven-gold": doughToolsPalette.ovenGold,
        basil: doughToolsPalette.basil,
        ink: doughToolsPalette.ink,
        muted: doughToolsPalette.muted,

        "brand-primary": doughToolsPalette.forest,
        "brand-primary-hover": doughToolsPalette.forestDark,
        "brand-primary-dark": doughToolsPalette.forestDark,
        "background-page": doughToolsPalette.warmBackground,
        "background-subtle": doughToolsPalette.flour,
        "background-card": doughToolsPalette.card,
        "background-dark": doughToolsPalette.ink,
        "background-marketing-dark": doughToolsPalette.forestDark,
        "text-primary": doughToolsPalette.ink,
        "text-secondary": doughToolsPalette.muted,
        "text-on-dark": doughToolsPalette.card,
        "text-brand": doughToolsPalette.forest,
        "border-default": doughToolsPalette.flour,
        "border-subtle": doughToolsPalette.warmBackground,
        "border-strong": doughToolsPalette.muted,
        "action-primary": doughToolsPalette.tomato,
        "action-primary-hover": doughToolsPalette.forest,
        "action-secondary": doughToolsPalette.forest,
        "action-danger": doughToolsPalette.tomato,
        "accent-tomato": doughToolsPalette.tomato,
        "accent-gold": doughToolsPalette.ovenGold,
        "accent-basil": doughToolsPalette.basil,
        "status-success": doughToolsPalette.basil,
        "status-warning": doughToolsPalette.ovenGold,
        "status-danger": doughToolsPalette.tomato,
        "status-info": doughToolsPalette.forest,
        "focus-ring": doughToolsPalette.tomato,

        // Compatibility aliases. New work should prefer semantic tokens above.
        cream: doughToolsPalette.warmBackground,
        leaf: doughToolsPalette.basil,
      },
      boxShadow: {
        card: "0 18px 60px rgba(42, 48, 39, 0.08)",
        raised: "0 24px 80px rgba(31, 31, 31, 0.12)",
        overlay: "0 30px 100px rgba(31, 31, 31, 0.24)",
      },
      borderRadius: {
        control: "0.75rem",
        card: "1.5rem",
        panel: "1.75rem",
        hero: "2rem",
        pill: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-newsreader)", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
