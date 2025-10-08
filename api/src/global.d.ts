/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import '../types/event-emitter';
import '../types/express-session';

declare global {
  type HyphenToUnderscore<S extends string> = S extends `${infer P}-${infer Q}`
    ? `${P}_${HyphenToUnderscore<Q>}`
    : S;
}

// eslint-disable-next-line prettier/prettier
export {};
