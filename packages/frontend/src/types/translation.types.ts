/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Translation as SharedTranslation } from "@hexabot-ai/types";

export type ITranslations = Record<string, string>;

export type Translation = SharedTranslation & {
  translated?: number;
};
