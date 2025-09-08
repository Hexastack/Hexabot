/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React from "react";
import ReactDOM from "react-dom/client";

import ChatWidget from "./ChatWidget.tsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChatWidget
      {...{
        apiUrl: process.env.REACT_APP_WIDGET_API_URL || "http://localhost:4000",
        channel: process.env.REACT_APP_WIDGET_CHANNEL || "web-channel",
        language: "en",
      }}
    />
  </React.StrictMode>,
);
