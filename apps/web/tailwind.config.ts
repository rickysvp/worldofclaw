import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ash: {
          950: "#070c12",
          900: "#0c141d",
          850: "#111b27",
          800: "#162231",
          750: "#1d2b3c",
          700: "#27384d"
        },
        rust: {
          300: "#f2b36f",
          400: "#d98949",
          500: "#b86137"
        },
        signal: {
          low: "#5fcf9d",
          medium: "#e0b35d",
          high: "#f07f63",
          critical: "#f05454",
          blue: "#74a8ff"
        }
      },
      boxShadow: {
        panel: "0 18px 48px rgba(0, 0, 0, 0.28)",
        glow: "0 0 0 1px rgba(116, 168, 255, 0.18), 0 0 32px rgba(116, 168, 255, 0.08)"
      },
      fontFamily: {
        console: ["IBM Plex Mono", "JetBrains Mono", "Menlo", "monospace"]
      },
      backgroundImage: {
        dust: "radial-gradient(circle at top, rgba(184,97,55,0.18), transparent 35%), linear-gradient(180deg, rgba(20,27,37,0.94) 0%, rgba(7,12,18,1) 100%)"
      }
    }
  },
  plugins: []
};

export default config;
