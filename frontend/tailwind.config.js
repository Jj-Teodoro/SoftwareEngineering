/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Krona One"', "Montserrat", "sans-serif"],
        mono: ['"Share Tech Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        gold: { DEFAULT: "#f2b400", soft: "#ffc933" },
        maroon: { DEFAULT: "#97191d", deep: "#5a0e12" },
        neon: { cyan: "#05d9e8", pink: "#ff2a6d" },
        ink: { DEFAULT: "#0c0607", panel: "#150b0c", raised: "#1c1011" },
      },
    },
  },
  plugins: [],
};
