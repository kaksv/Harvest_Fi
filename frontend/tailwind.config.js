/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        harvest: {
          green:  "#2D6A4F",
          amber:  "#D4A017",
          cream:  "#F5F0E8",
          brown:  "#5C3317",
        },
      },
    },
  },
  plugins: [],
};
