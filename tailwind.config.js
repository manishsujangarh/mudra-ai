/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0E7C66",
          light: "#3AA88C",
          dark: "#0A5C4B",
        },
        sand: "#F7F4EF",
        ink: "#1C2826",
        muted: "#6B7B77",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
