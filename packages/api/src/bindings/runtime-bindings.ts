/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

/**
 * Module augmentation contract for runtime binding kinds.
 * Extension packages should augment this interface using:
 * declare global { interface RuntimeBindingKindRegistry { ... } }
 */
declare global {
  /**
   * Optional global augmentation hook when module augmentation is not practical.
   */
  interface RuntimeBindingKindRegistry {}
}

export type RuntimeBindingKind = keyof RuntimeBindingKindRegistry & string;

export type RuntimeBindingPayload<K extends RuntimeBindingKind> = z.infer<
  RuntimeBindingKindRegistry[K]['schema']
>;

export type RuntimeBindingValue<K extends RuntimeBindingKind> =
  RuntimeBindingKindRegistry[K]['multiple'] extends true
    ? Record<string, RuntimeBindingPayload<K>>
    : RuntimeBindingKindRegistry[K]['multiple'] extends false
      ? RuntimeBindingPayload<K>
      : RuntimeBindingPayload<K> | Record<string, RuntimeBindingPayload<K>>;

export type RuntimeBindings = Partial<{
  [K in RuntimeBindingKind]: RuntimeBindingValue<K>;
}>;

export type RegisterRuntimeBindingKindParams = {
  kind: string;
  schema: z.ZodTypeAny;
  multiple: boolean;
};
