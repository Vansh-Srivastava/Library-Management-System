import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend calls VITE_API_BASE_URL (default http://localhost:8000/api).
// In dev you can instead point the client at "/api" and let this proxy forward
// to Django, avoiding CORS entirely. Either approach works.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
