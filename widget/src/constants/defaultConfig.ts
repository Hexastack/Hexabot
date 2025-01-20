/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
