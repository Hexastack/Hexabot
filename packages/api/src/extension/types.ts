/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ExtensionName } from '@/utils/types/extension';

export type TExtensionName = Extract<ExtensionName, `${string}-${string}`>;

export type TExtension = TExtensionName extends `${string}-${infer S}`
  ? `${S}`
  : never;

export type TExtensionGroup = TExtensionName;

export type TExtractGroup<
  T extends TExtension = TExtension,
  M extends TExtensionName = TExtensionName,
> = M extends `${string}${T}` ? M : never;

export type TCriteria = {
  suffix: `-${TExtension}`;
  groups: TExtensionGroup[];
};
