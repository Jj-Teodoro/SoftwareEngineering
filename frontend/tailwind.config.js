import preset from "./src/shared/tailwind.preset.js";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  plugins: [],
};
