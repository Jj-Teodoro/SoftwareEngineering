import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@oasis/shared": path.resolve(__dirname, "src/shared"),
    },
  },
  // the Django CORS settings expect the app on this port
  server: { port: 5173, strictPort: true },
});
