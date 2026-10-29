/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Requesto brand purple.
        brand: {
          DEFAULT: "#5B4BF5",
          dark: "#4537d4",
          light: "#EEECFE",
        },
      },
    },
  },
  plugins: [],
};
