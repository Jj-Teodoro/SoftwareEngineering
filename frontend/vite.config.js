import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // the Django CORS settings expect the app on this port
  server: { port: 5173, strictPort: true },
});
