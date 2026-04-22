/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  Translation as SharedTranslation,
  TranslationFull as SharedTranslationFull,
  TranslationStub as SharedTranslationStub,
} from "@hexabot-ai/types";

export type ITranslations = Record<string, string>;

export type ITranslationAttributes = Pick<
  SharedTranslation,
  "str" | "translations"
>;

export type ITranslationStub = SharedTranslationStub & {
  translated?: number;
};

export type Translation = SharedTranslation & {
  translated?: number;
};

export type TranslationFull = SharedTranslationFull & {
  translated?: number;
};
