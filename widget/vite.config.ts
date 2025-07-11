/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
