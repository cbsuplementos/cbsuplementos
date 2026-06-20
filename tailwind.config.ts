import type { Config } from "tailwindcss";

/**
 * Tailwind Config — CB Suplementos
 *
 * Paleta oficial da marca (extraída da logomarca):
 * - gold: dourado vibrante #D4A24C (CTA, links, destaques)
 * - noir: preto profundo #0A0A0A (fundo principal)
 * - graphite/charcoal: cinzas escuros (seções alternativas, cards)
 * - cool-gray: cinza claro (texto secundário sobre fundo escuro)
 *
 * Tipografia:
 * - sans: Inter (corpo, formulários)
 * - display: Bebas Neue (heroes, headlines impactantes)
 * - oswald: Oswald (subtítulos, taglines uppercase)
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: "rgb(var(--color-noir) / <alpha-value>)",
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          light: "rgb(var(--color-gold-light) / <alpha-value>)",
          dark: "rgb(var(--color-gold-dark) / <alpha-value>)",
        },
        graphite: "rgb(var(--color-graphite) / <alpha-value>)",
        charcoal: "rgb(var(--color-charcoal) / <alpha-value>)",
        "cool-gray": "rgb(var(--color-cool-gray) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
        oswald: ["var(--font-oswald)", "Impact", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.04em",
        widest: "0.25em",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.8s ease-out",
        "pulse-gold": "pulseGold 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 18px rgba(212,162,76,0.35)" },
          "50%": { boxShadow: "0 0 32px rgba(212,162,76,0.7)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
