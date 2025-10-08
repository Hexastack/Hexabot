/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

export type TFilterNestedKeysOfType<T, U = string> = T extends object
  ? {
      [K in keyof T]: T[K] extends U
        ? `${K & string}`
        : T[K] extends object
        ? Array<any> extends T[K]
          ? never
          : `${K & string}.${TFilterNestedKeysOfType<T[K], U>}`
        : never;
    }[keyof T]
  : never;
