import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        // If your backend routes are NOT prefixed with /api, uncomment:
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
