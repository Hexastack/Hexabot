/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { FULL_WIDTH_PATHNAMES } from "@/services/types";

type TLayout = "default" | "full_width";

export const getLayout = (pathname: string): TLayout =>
  FULL_WIDTH_PATHNAMES.some((path) => pathname.startsWith(path))
    ? "full_width"
    : "default";
