/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sand: "rgb(var(--color-sand) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          light: "rgb(var(--color-surface-light) / <alpha-value>)",
        },
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        brand: {
          DEFAULT: "#FF9500",
          light: "#FFB340",
          dark: "#FF9F0A",
        },

        background: {
          DEFAULT: "#F2F2F7",
          secondary: "#FFFFFF",
        },

        text: {
          primary: "#1C1C1E",
          secondary: "#3A3A3C",
          muted: "#8E8E93",
        },

        accent: {
          red: "#FF3B30",
          gold: "#FFCC00",
          cream: "#F9F9FB",
        },
      },

      fontFamily: {
        sans: ["System"],
      },

      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.08)",
      },

      borderRadius: {
        xl: "20px",
      },
    },
  },
  plugins: [],
};
