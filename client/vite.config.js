import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// We proxy /api to the backend so the browser talks to a single origin
// (localhost:5173). That keeps the httpOnly auth cookie first-party and avoids
// CORS headaches in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
