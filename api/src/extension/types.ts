/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
