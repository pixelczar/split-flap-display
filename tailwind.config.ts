import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "zoom-in": {
          "0%": { transform: "scale(97%)" },
          "102%": { transform: "scale(102%)" },
          "100%": { transform: "scale(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 100ms ease-out",
        "zoom-in": "zoom-in 100ms ease-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config

export default config

