/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BindingKindDescriptor, BindingKindSchemas } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';

import { RegisterRuntimeBindingKindParams } from '@/bindings/runtime-bindings';
import { toDraft07JsonSchema } from '@/utils/helpers/zod';

@Injectable()
export class RuntimeBindingsService {
  private static readonly registry = new Map<string, BindingKindDescriptor>();

  register({ kind, schema, multiple }: RegisterRuntimeBindingKindParams): void {
    if (RuntimeBindingsService.registry.has(kind)) {
      throw new Error(
        `Runtime binding kind "${kind}" is already registered and cannot be registered again.`,
      );
    }

    RuntimeBindingsService.registry.set(kind, { schema, multiple });
  }

  get(kind: string): BindingKindDescriptor {
    const bindingKind = RuntimeBindingsService.registry.get(kind);

    if (!bindingKind) {
      throw new Error(`Unable to find runtime binding kind "${kind}"`);
    }

    return bindingKind;
  }

  getAll(): BindingKindDescriptor[] {
    return Array.from(RuntimeBindingsService.registry.values());
  }

  getRegistry(): BindingKindSchemas {
    return RuntimeBindingsService.getRegistry();
  }

  static getRegistry(): BindingKindSchemas {
    return Object.fromEntries(
      RuntimeBindingsService.registry.entries(),
    ) as BindingKindSchemas;
  }

  static getRegistryOrThrow(context: string): BindingKindSchemas {
    if (RuntimeBindingsService.registry.size > 0) {
      return RuntimeBindingsService.getRegistry();
    }

    throw new Error(
      `Runtime binding kinds registry is empty while resolving ${context}. Binding kinds are discovered through dynamic providers. Ensure resolveDynamicProviders() runs before bootstrapping NestJS and that BindingsModule is loaded.`,
    );
  }

  reset(): void {
    RuntimeBindingsService.registry.clear();
  }

  getAllSchemaDefinitions() {
    const kinds = RuntimeBindingsService.getRegistryOrThrow(
      'workflow runtime binding schema definitions',
    );

    return Object.fromEntries(
      Object.entries(kinds).map(([bindingKind, bindingDefinition]) => [
        bindingKind,
        {
          schema: toDraft07JsonSchema(bindingDefinition.schema),
          multiple: bindingDefinition.multiple,
        },
      ]),
    );
  }
}
