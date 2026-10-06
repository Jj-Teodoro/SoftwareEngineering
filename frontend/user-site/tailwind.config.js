/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}", "../shared/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Krona One"', "Montserrat", "sans-serif"],
        mono: ['"Share Tech Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
