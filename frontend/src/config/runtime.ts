/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const runtimeConfig = {
  lang: {
    default: import.meta.env.VITE_DEFAULT_LANGUAGE?.toString() || "en",
  },
};
