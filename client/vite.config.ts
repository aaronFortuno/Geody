import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: process.env["VITE_BASE_PATH"] ?? "./",
  resolve: {
    alias: {
      "@geody/shared": resolve(__dirname, "../shared/types.ts"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 2000,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts",
  },
});
