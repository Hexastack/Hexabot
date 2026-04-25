/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

export type SettingScope = 'global' | 'extension';

export type SettingExtensionType = 'action' | 'helper';

export type RuntimeSettingGroupSchema = z.ZodObject<z.ZodRawShape>;

/**
 * Module augmentation contract for runtime setting groups.
 * Extension packages should augment this interface using:
 * declare global { interface RuntimeSettingRegistry { ... } }
 */
declare global {
  /**
   * Optional global augmentation hook when module augmentation is not practical.
   */
  interface RuntimeSettingRegistry {}
}

export type RuntimeSettingGroup = keyof RuntimeSettingRegistry & string;

type RuntimeSettingSchema<G extends RuntimeSettingGroup> =
  RuntimeSettingRegistry[G] extends RuntimeSettingGroupSchema
    ? RuntimeSettingRegistry[G]
    : never;

export type RuntimeSettings = {
  [G in RuntimeSettingGroup]: z.infer<RuntimeSettingSchema<G>>;
};

export type RuntimeSettingGroupDescriptor<
  G extends string = string,
  S extends RuntimeSettingGroupSchema = RuntimeSettingGroupSchema,
> = {
  group: G;
  schema: S;
  scope: SettingScope;
  extensionType?: SettingExtensionType;
  extensionName?: string;
};

export type RegisterRuntimeSettingGroupParams<
  G extends string = string,
  S extends RuntimeSettingGroupSchema = RuntimeSettingGroupSchema,
> = RuntimeSettingGroupDescriptor<G, S>;

export const getRuntimeSettingShape = (
  schema: RuntimeSettingGroupSchema,
): Record<string, z.ZodTypeAny> => {
  return schema.shape as Record<string, z.ZodTypeAny>;
};
