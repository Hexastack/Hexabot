/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { I18nContext } from 'nestjs-i18n';
import { z } from 'zod';

import { I18nService } from '@/i18n/services/i18n.service';
import { createSettingGroup } from '@/setting/create-setting-group';
import { RuntimeSettingsService } from '@/setting/services/runtime-settings.service';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';

describe('RuntimeSettingsService', () => {
  let moduleRef: TestingModule | undefined;
  const runtimeSettingsService = new RuntimeSettingsService(
    I18nServiceProvider.useValue as unknown as I18nService,
  );

  beforeEach(() => {
    runtimeSettingsService.reset();
    (I18nServiceProvider.useValue.t as jest.Mock).mockImplementation(
      (key: string, options?: { defaultValue?: string }) => {
        return options?.defaultValue ?? key;
      },
    );
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
    const schema = z
      .strictObject({
        enabled: z.boolean().default(true).meta({ title: 'Enabled' }),
      })
      .meta({
        title: 'Feature flags',
      });

    runtimeSettingsService.register({
      group,
      schema,
      scope: 'extension',
      extensionType: 'channel',
      extensionName: 'test',
    });

    const fieldSchema = runtimeSettingsService.getSchemaFor(group, 'enabled');
    const fieldResult = fieldSchema.safeParse(false);
    const definitions = runtimeSettingsService.getAllSchemaDefinitions();

    expect(fieldResult.success).toBe(true);
    expect(definitions[group]).toBeDefined();
    expect(definitions[group]?.scope).toBe('extension');
    expect(definitions[group]?.extensionType).toBe('channel');
    expect(definitions[group]?.extensionName).toBe('test');
    expect(definitions[group]?.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    expect((definitions[group]?.schema as { title?: string })?.title).toBe(
      'Feature flags',
    );
  });

  it('localizes root schema title using the request language', () => {
    const group = `localized_settings_${Date.now()}`;
    const schema = z
      .strictObject({
        enabled: z.boolean().default(true).meta({ title: 'Enabled' }),
      })
      .meta({
        title: 'Feature flags',
      });
    const currentSpy = jest
      .spyOn(I18nContext, 'current')
      .mockReturnValue({ lang: 'fr' } as unknown as I18nContext<unknown>);

    (I18nServiceProvider.useValue.t as jest.Mock).mockImplementation(
      (
        key: string,
        options?: { ns?: string; lang?: string; defaultValue?: string },
      ) => {
        if (
          key === 'Feature flags' &&
          options?.ns === group &&
          options?.lang === 'fr'
        ) {
          return 'FR Feature flags';
        }

        return options?.defaultValue ?? key;
      },
    );

    runtimeSettingsService.register({
      group,
      schema,
      scope: 'extension',
    });

    const definitions = runtimeSettingsService.getAllSchemaDefinitions();

    expect((definitions[group]?.schema as { title?: string })?.title).toBe(
      'FR Feature flags',
    );

    currentSpy.mockRestore();
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
      extensionName: 'test',
    });

    moduleRef = await Test.createTestingModule({
      providers: [
        RuntimeSettingsService,
        CustomSettingsGroupProvider,
        I18nServiceProvider,
      ],
    }).compile();
    await moduleRef.init();

    const definitions = moduleRef
      .get(RuntimeSettingsService)
      .getAllSchemaDefinitions();

    expect(definitions[customGroup]).toBeDefined();
    expect(definitions[customGroup]?.scope).toBe('extension');
    expect(definitions[customGroup]?.extensionType).toBe('helper');
    expect(definitions[customGroup]?.extensionName).toBe('test');
    expect(definitions[customGroup]?.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
  });
});
