/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React from "react";
import ReactDOM from "react-dom/client";

import ChatWidget from "./ChatWidget.tsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChatWidget
      {...{
        apiUrl: process.env.REACT_APP_WIDGET_API_URL || "http://localhost:8080",
        channel: process.env.REACT_APP_WIDGET_CHANNEL || "web-channel",
        language: "en",
      }}
    />
  </React.StrictMode>,
);
