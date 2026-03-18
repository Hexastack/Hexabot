/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  BindingKindDescriptor,
  InferWorkflowBindings,
} from '@hexabot-ai/agentic';
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

type RuntimeBindingPresentation = {
  color: string;
  icon: string;
};

export type RuntimeBindingKindDescriptor<
  S extends z.ZodTypeAny = z.ZodTypeAny,
  M extends boolean = boolean,
> = BindingKindDescriptor<S, M> & RuntimeBindingPresentation;

export type RuntimeBindingKindSchemas = Record<
  string,
  RuntimeBindingKindDescriptor
>;

type RuntimeBindingKindDescriptorInput<
  S extends z.ZodTypeAny = z.ZodTypeAny,
  M extends boolean = boolean,
> = Omit<RuntimeBindingKindDescriptor<S, M>, 'color' | 'icon'> &
  Partial<Pick<RuntimeBindingKindDescriptor<S, M>, 'color' | 'icon'>>;

export type BindingKindMetadata<
  K extends string = string,
  S extends z.ZodTypeAny = z.ZodTypeAny,
  M extends boolean = boolean,
> = {
  kind: K;
} & RuntimeBindingKindDescriptorInput<S, M>;

type RuntimeBindingDescriptor<K extends RuntimeBindingKind> =
  RuntimeBindingKindRegistry[K] & RuntimeBindingKindDescriptor;

type RuntimeBindingDescriptors = {
  [K in RuntimeBindingKind]: RuntimeBindingDescriptor<K>;
};

export type RuntimeBindingPayload<K extends RuntimeBindingKind> = z.infer<
  RuntimeBindingDescriptor<K>['schema']
>;

export type RuntimeBindings = InferWorkflowBindings<RuntimeBindingDescriptors>;

export type RuntimeBindingValue<K extends RuntimeBindingKind> = NonNullable<
  RuntimeBindings[K]
>;

export type RegisterRuntimeBindingKindParams<
  K extends string = string,
  S extends z.ZodTypeAny = z.ZodTypeAny,
  M extends boolean = boolean,
> = {
  kind: K;
} & RuntimeBindingKindDescriptor<S, M>;
