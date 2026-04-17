/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import z from 'zod';

import { RuntimeSettingRegistryMap } from '@/setting/services/runtime-settings.service';

import {
  buildSettingSeedsFromRegistry,
  buildSettingSeedsFromSchema,
} from './runtime-settings.seed';

describe('runtime-settings.seed', () => {
  it('adds subgroup marker when provided to schema seed builder', () => {
    const schema = z.strictObject({
      enabled: z.boolean().default(true),
    });

    expect(
      buildSettingSeedsFromSchema('web', schema, { subgroup: 'channel' }),
    ).toEqual([
      {
        group: 'web',
        subgroup: 'channel',
        label: 'enabled',
        value: true,
      },
    ]);
  });

  it('adds subgroup marker for channel/helper extension groups from runtime registry', () => {
    const registry: RuntimeSettingRegistryMap = {
      web: {
        schema: z.strictObject({
          enabled: z.boolean().default(true),
        }),
        scope: 'extension',
        extensionType: 'channel',
        extensionName: 'web',
      },
      ollama: {
        schema: z.strictObject({
          base_url: z.string().default('http://localhost:11434'),
        }),
        scope: 'extension',
        extensionType: 'helper',
        extensionName: 'ollama',
      },
      ai_generate_text: {
        schema: z.strictObject({
          model: z.string().default('gpt-4.1-mini'),
        }),
        scope: 'extension',
        extensionType: 'action',
        extensionName: 'ai_generate_text',
      },
      chatbot_settings: {
        schema: z.strictObject({
          global_fallback: z.boolean().default(true),
        }),
        scope: 'global',
      },
    };
    const seeds = buildSettingSeedsFromRegistry(registry);
    const webSeed = seeds.find(
      (seed) => seed.group === 'web' && seed.label === 'enabled',
    );
    const ollamaSeed = seeds.find(
      (seed) => seed.group === 'ollama' && seed.label === 'base_url',
    );
    const actionSeed = seeds.find(
      (seed) => seed.group === 'ai_generate_text' && seed.label === 'model',
    );
    const globalSeed = seeds.find(
      (seed) =>
        seed.group === 'chatbot_settings' && seed.label === 'global_fallback',
    );

    expect(webSeed).toEqual({
      group: 'web',
      subgroup: 'channel',
      label: 'enabled',
      value: true,
    });
    expect(ollamaSeed).toEqual({
      group: 'ollama',
      subgroup: 'helper',
      label: 'base_url',
      value: 'http://localhost:11434',
    });
    expect(actionSeed).toEqual({
      group: 'ai_generate_text',
      label: 'model',
      value: 'gpt-4.1-mini',
    });
    expect(globalSeed).toEqual({
      group: 'chatbot_settings',
      label: 'global_fallback',
      value: true,
    });
  });
});
