/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChannelName } from '@/channel/types';
import { HelperName } from '@/helper/types';

export type ExtensionName = ChannelName | HelperName;

export type HyphenToUnderscore<S extends string> =
  S extends `${infer P}-${infer Q}` ? `${P}_${HyphenToUnderscore<Q>}` : S;
