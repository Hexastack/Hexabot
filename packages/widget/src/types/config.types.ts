/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ThemeMode, ThemeOverrides } from "../theme/theme.types";

export type Config = {
  apiUrl: string;
  channel: string;
  language: string;
  maxUploadSize: number;
  workflowId?: string;
  instanceId?: string;
  mode?: ThemeMode;
  theme?: ThemeOverrides;
  primaryColor?: string;
};
