/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { JSONSchema7 as JsonSchema } from 'json-schema';
import { I18nContext } from 'nestjs-i18n';
import { z } from 'zod';

import { I18nService } from '@/i18n/services/i18n.service';
import { toDraft07JsonSchema } from '@/utils/helpers/zod';

import {
  RegisterRuntimeSettingGroupParams,
  SettingExtensionType,
  SettingScope,
  getRuntimeSettingShape,
} from '../runtime-settings';

export type RuntimeSettingGroupDefinition = {
  schema: z.ZodTypeAny;
  scope: SettingScope;
  extensionType?: SettingExtensionType;
  extensionName?: string;
};

export type RuntimeSettingRegistryMap = Record<
  string,
  RuntimeSettingGroupDefinition
>;

export type RuntimeSettingSchemaDefinitions = Record<
  string,
  {
    schema: JsonSchema;
    scope: SettingScope;
    extensionType?: SettingExtensionType;
    extensionName?: string;
  }
>;

@Injectable()
export class RuntimeSettingsService {
  private static readonly registry = new Map<
    string,
    RuntimeSettingGroupDefinition
  >();

  constructor(private readonly i18nService: I18nService) {}

  register({
    group,
    schema,
    scope,
    extensionType,
    extensionName,
  }: RegisterRuntimeSettingGroupParams): void {
    if (RuntimeSettingsService.registry.has(group)) {
      throw new Error(
        `Runtime setting group "${group}" is already registered and cannot be registered again.`,
      );
    }

    RuntimeSettingsService.registry.set(group, {
      schema,
      scope,
      extensionType,
      extensionName,
    });
  }

  get(group: string): RuntimeSettingGroupDefinition {
    const definition = RuntimeSettingsService.registry.get(group);

    if (!definition) {
      throw new Error(`Unable to find runtime setting group "${group}"`);
    }

    return definition;
  }

  getAll(): RuntimeSettingGroupDefinition[] {
    return Array.from(RuntimeSettingsService.registry.values());
  }

  getRegistry(): RuntimeSettingRegistryMap {
    return RuntimeSettingsService.getRegistry();
  }

  static getRegistry(): RuntimeSettingRegistryMap {
    return Object.fromEntries(
      RuntimeSettingsService.registry.entries(),
    ) as RuntimeSettingRegistryMap;
  }

  static getRegistryOrThrow(context: string): RuntimeSettingRegistryMap {
    if (RuntimeSettingsService.registry.size > 0) {
      return RuntimeSettingsService.getRegistry();
    }

    throw new Error(
      `Runtime settings registry is empty while resolving ${context}. Settings are discovered through dynamic providers. Ensure resolveDynamicProviders() runs before bootstrapping NestJS and that SettingModule is loaded.`,
    );
  }

  reset(): void {
    RuntimeSettingsService.registry.clear();
  }

  getSchemaFor(group: string, label: string): z.ZodTypeAny {
    const { schema } = this.get(group);
    const shape = getRuntimeSettingShape(schema as z.ZodObject<z.ZodRawShape>);
    const settingSchema = shape[label];

    if (!settingSchema) {
      throw new Error(`Unable to find setting schema "${group}.${label}"`);
    }

    return settingSchema;
  }

  getAllSchemaDefinitions(): RuntimeSettingSchemaDefinitions {
    const groups = RuntimeSettingsService.getRegistryOrThrow(
      'setting schema definitions',
    );
    const lang = I18nContext.current()?.lang;

    return Object.fromEntries(
      Object.entries(groups).map(([group, definition]) => [
        group,
        {
          schema: toDraft07JsonSchema(
            definition.schema,
            this.i18nService.getJsonSchemaLocalizationOptions(group, lang),
          ),
          scope: definition.scope,
          ...(definition.extensionType
            ? { extensionType: definition.extensionType }
            : {}),
          ...(definition.extensionName
            ? { extensionName: definition.extensionName }
            : {}),
        },
      ]),
    );
  }
}
