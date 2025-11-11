/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000/",
      },
      "/socket.io": {
        target: "ws://localhost:3000/",
      },
    },
  },
  preview: {
    host: true,
    port: 8080,
  },
});
