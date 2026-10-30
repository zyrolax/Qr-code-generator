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
        // Editor chrome: warm neutral paper, charcoal ink, one restrained accent.
        paper: "#F3EEE6",
        panel: "#FBF9F5",
        ink: "#2A2824",
        clay: "#9C6B4A",
      },
      fontFamily: {
        // `sans`/`mono` keep Tailwind's defaults; these give headings/pages an
        // elegant alternative and a friendly rounded option.
        serif: ['"Iowan Old Style"', "Georgia", "Cambria", '"Times New Roman"', "serif"],
        rounded: ['ui-rounded', '"SF Pro Rounded"', '"Hiragino Maru Gothic ProN"', "Quicksand", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
