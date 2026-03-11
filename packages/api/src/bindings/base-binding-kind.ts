/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';

import { BindingKindMetadata } from '@/bindings/runtime-bindings';
import { RuntimeBindingsService } from '@/bindings/runtime-bindings.service';

@Injectable()
export abstract class BaseBindingKindProvider<
  K extends string = string,
  S extends z.ZodTypeAny = z.ZodTypeAny,
  M extends boolean = boolean,
> implements OnModuleInit
{
  private static readonly DEFAULT_COLOR = '#7f8ea3';

  private static readonly DEFAULT_ICON = 'Zap';

  public readonly kind: K;

  public readonly schema: S;

  public readonly multiple: M;

  public readonly color: string;

  public readonly icon: string;

  private readonly runtimeBindingsService: RuntimeBindingsService;

  protected constructor(
    metadata: BindingKindMetadata<K, S, M>,
    runtimeBindingsService: RuntimeBindingsService,
  ) {
    this.runtimeBindingsService = runtimeBindingsService;
    this.kind = metadata.kind;
    this.schema = metadata.schema;
    this.multiple = metadata.multiple;
    this.color = metadata.color ?? BaseBindingKindProvider.DEFAULT_COLOR;
    this.icon = metadata.icon ?? BaseBindingKindProvider.DEFAULT_ICON;
  }

  onModuleInit() {
    this.runtimeBindingsService.register({
      kind: this.kind,
      schema: this.schema,
      multiple: this.multiple,
      color: this.color,
      icon: this.icon,
    });
  }
}
