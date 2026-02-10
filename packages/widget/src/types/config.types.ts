/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ThemeOverrides } from "../theme/theme.types";

export type Config = {
  apiUrl: string;
  channel: string;
  language: string;
  maxUploadSize: number;
  instanceId?: string;
  theme?: ThemeOverrides;
  theme_color?: string;
  themeColor?: string;
};
