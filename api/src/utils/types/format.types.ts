/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

export enum Format {
  NONE = 0,
  STUB = 1,
  BASIC = 2,
  FULL = 3,
}

export type TStubOrFull<TF, TStub, TFull> = TF extends Format.STUB
  ? TStub
  : TFull;
