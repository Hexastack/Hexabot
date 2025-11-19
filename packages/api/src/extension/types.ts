/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ExtensionName } from '@/utils/types/extension';

type TExcludedExtension = 'plugin';

type TExcludeSuffix<
  T,
  S extends string = '_',
  Suffix extends string = `${S}${TExcludedExtension}`,
> = T extends `${infer _Base}${Suffix}` ? never : T;

export type TExtensionName = TExcludeSuffix<ExtensionName, '-'>;

export type TExtension =
  Extract<TExtensionName, `${string}-${string}`> extends `${string}-${infer S}`
    ? `${S}`
    : never;

export type TNamespace = HyphenToUnderscore<TExtensionName>;

export type TExtractNamespace<
  T extends TExtension = TExtension,
  M extends TExtensionName = TExtensionName,
> = M extends `${string}${T}` ? HyphenToUnderscore<M> : never;

export type TExtractExtension<
  T extends TExtension = TExtension,
  M extends TExtensionName = TExtensionName,
> = M extends `${string}${T}` ? M : never;

export type TCriteria = {
  suffix: `_${TExtension}`;
  namespaces: TNamespace[];
};
