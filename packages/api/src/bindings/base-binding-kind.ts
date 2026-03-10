/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';

import { RuntimeBindingsService } from '@/bindings/runtime-bindings.service';

export type BindingKindMetadata<
  K extends string = string,
  S extends z.ZodTypeAny = z.ZodTypeAny,
  M extends boolean = boolean,
> = {
  kind: K;
  schema: S;
  multiple: M;
};

@Injectable()
export abstract class BaseBindingKindProvider<
  K extends string = string,
  S extends z.ZodTypeAny = z.ZodTypeAny,
  M extends boolean = boolean,
> implements OnModuleInit
{
  public readonly kind: K;

  public readonly schema: S;

  public readonly multiple: M;

  private readonly runtimeBindingsService: RuntimeBindingsService;

  protected constructor(
    metadata: BindingKindMetadata<K, S, M>,
    runtimeBindingsService: RuntimeBindingsService,
  ) {
    this.runtimeBindingsService = runtimeBindingsService;
    this.kind = metadata.kind;
    this.schema = metadata.schema;
    this.multiple = metadata.multiple;
  }

  onModuleInit() {
    this.runtimeBindingsService.register({
      kind: this.kind,
      schema: this.schema,
      multiple: this.multiple,
    });
  }
}
