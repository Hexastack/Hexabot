/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import type { NextApiRequest, NextApiResponse } from "next";

import { parseEnvBoolean, parseEnvNumber } from "@/utils/env";

type ResponseData = {
  apiUrl: string;
  ssoEnabled: boolean;
  maxUploadSize: number;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const MB = 1024 * 1024;
  const config: ResponseData = {
    apiUrl: process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:4000",
    ssoEnabled: parseEnvBoolean(process.env.NEXT_PUBLIC_SSO_ENABLED, false),
    maxUploadSize: parseEnvNumber(
      process.env.UPLOAD_MAX_SIZE_IN_BYTES,
      20 * MB,
    ),
  };

  res.status(200).json(config);
}
