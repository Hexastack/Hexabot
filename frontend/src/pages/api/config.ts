/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
