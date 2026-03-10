/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, Type } from '@nestjs/common';
import { z } from 'zod';

import {
  BaseBindingKindProvider,
  BindingKindMetadata,
} from './base-binding-kind';
import { RuntimeBindingsService } from './runtime-bindings.service';

type CreateBindingKindParams<
  K extends string,
  S extends z.ZodTypeAny,
  M extends boolean,
> = BindingKindMetadata<K, S, M>;

export function createBindingKind<
  K extends string,
  S extends z.ZodTypeAny,
  M extends boolean,
>(
  params: CreateBindingKindParams<K, S, M>,
): Type<BaseBindingKindProvider<K, S, M>> {
  @Injectable()
  class FnBindingKindProvider extends BaseBindingKindProvider<K, S, M> {
    constructor(runtimeBindingsService: RuntimeBindingsService) {
      super(params, runtimeBindingsService);
    }
  }

  return FnBindingKindProvider;
}
