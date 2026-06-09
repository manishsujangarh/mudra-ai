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
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        brand: {
          DEFAULT: "#e06040", // Main Pinterest red
          light: "#e06040",
          dark: "#e06040",
        },

        background: {
          DEFAULT: "#e06040", // Soft warm white
          secondary: "#EFE8E5",
        },

        text: {
          primary: "#111111", // Main black heading
          secondary: "#444444",
          muted: "#777777",
        },

        accent: {
          red: "#D40000",
          gold: "#E7D6B5", // Mandala pattern color
          cream: "#FFF8F2",
        },
      },

      fontFamily: {
        sans: ["System"],
      },

      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.08)",
      },

      borderRadius: {
        xl: "20px",
      },
    },
  },
  plugins: [],
};
