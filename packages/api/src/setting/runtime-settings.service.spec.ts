/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { z } from 'zod';

import { createSettingGroup } from '@/setting/create-setting-group';
import { RuntimeSettingsService } from '@/setting/runtime-settings.service';

describe('RuntimeSettingsService', () => {
  let moduleRef: TestingModule | undefined;
  const runtimeSettingsService = new RuntimeSettingsService();

  beforeEach(() => {
    runtimeSettingsService.reset();
  });

  afterEach(async () => {
    runtimeSettingsService.reset();
    await moduleRef?.close();
    moduleRef = undefined;
  });

  it('throws when runtime settings are requested before bootstrap', () => {
    expect(() => runtimeSettingsService.getAllSchemaDefinitions()).toThrow(
      /Runtime settings registry is empty while resolving setting schema definitions/,
    );
  });

  it('returns Draft-07 definitions and resolves field schemas', () => {
    const group = `feature_flags_${Date.now()}`;
    const schema = z.strictObject({
      enabled: z.boolean().default(true).meta({ title: 'Enabled' }),
    });

    runtimeSettingsService.register({
      group,
      schema,
      scope: 'extension',
      extensionType: 'channel',
      extensionName: 'test-channel',
    });

    const fieldSchema = runtimeSettingsService.getSchemaFor(group, 'enabled');
    const fieldResult = fieldSchema.safeParse(false);
    const definitions = runtimeSettingsService.getAllSchemaDefinitions();

    expect(fieldResult.success).toBe(true);
    expect(definitions[group]).toBeDefined();
    expect(definitions[group]?.scope).toBe('extension');
    expect(definitions[group]?.extensionType).toBe('channel');
    expect(definitions[group]?.extensionName).toBe('test-channel');
    expect(definitions[group]?.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
  });

  it('fails fast when registering duplicate groups', () => {
    const duplicateGroup = `duplicate_settings_${Date.now()}`;
    const schema = z.strictObject({
      enabled: z.boolean().default(true).meta({ title: 'Enabled' }),
    });

    runtimeSettingsService.register({
      group: duplicateGroup,
      schema,
      scope: 'global',
    });

    expect(() =>
      runtimeSettingsService.register({
        group: duplicateGroup,
        schema,
        scope: 'global',
      }),
    ).toThrow(
      new RegExp(
        `Runtime setting group \"${duplicateGroup}\" is already registered`,
      ),
    );
  });

  it('registers custom setting groups provided via setting-group providers', async () => {
    const customGroup = `custom_group_${Date.now()}`;
    const customSchema = z.strictObject({
      retries: z
        .number()
        .int()
        .default(3)
        .meta({
          title: 'Retries',
          'ui:options': {
            step: 1,
          },
        }),
    });
    const CustomSettingsGroupProvider = createSettingGroup({
      group: customGroup,
      schema: customSchema,
      scope: 'extension',
      extensionType: 'helper',
      extensionName: 'test-helper',
    });

    moduleRef = await Test.createTestingModule({
      providers: [RuntimeSettingsService, CustomSettingsGroupProvider],
    }).compile();
    await moduleRef.init();

    const definitions = moduleRef
      .get(RuntimeSettingsService)
      .getAllSchemaDefinitions();

    expect(definitions[customGroup]).toBeDefined();
    expect(definitions[customGroup]?.scope).toBe('extension');
    expect(definitions[customGroup]?.extensionType).toBe('helper');
    expect(definitions[customGroup]?.extensionName).toBe('test-helper');
    expect(definitions[customGroup]?.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
  });
});
