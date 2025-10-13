/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Config } from "../types/config.types";

export const DEFAULT_CONFIG: Config = {
  apiUrl: process.env.REACT_APP_WIDGET_API_URL || "http://localhost:4000",
  channel: process.env.REACT_APP_WIDGET_CHANNEL || "console-channel",
  language: "en",
  maxUploadSize: process.env.UPLOAD_MAX_SIZE_IN_BYTES
    ? Number(process.env.UPLOAD_MAX_SIZE_IN_BYTES)
    : 20 * 1024 * 1024, // 20 MB in bytes
};
