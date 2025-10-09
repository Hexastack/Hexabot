/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Config } from "../types/config.types";

export const DEFAULT_CONFIG: Config = {
  apiUrl: "http://localhost:4000",
  channel: "console-channel",
  language: "en",
  maxUploadSize: 20 * 1024 * 1024, // 20 MB in bytes
};
