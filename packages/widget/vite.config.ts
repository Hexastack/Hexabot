/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { resolve } from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), dts()],
    server: {
      host: "0.0.0.0",
    },
    define: {
      "process.env":
        mode === "development" ? { "process.env": process.env } : {},
    },
    build: {
      lib: {
        entry: resolve(__dirname, "src/ChatWidget.tsx"),
        name: "HexabotWidget",
        fileName: (format) => `hexabot-widget.${format}.js`,
        cssFileName: "style",
      },
      rollupOptions: {
        external: ["react", "react-dom"],
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
          },
        },
      },
    },
  };
});
