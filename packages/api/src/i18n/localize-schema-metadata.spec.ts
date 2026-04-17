/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { I18nService } from '@/i18n/services/i18n.service';

import { localizeSchemaMetadata } from './localize-schema-metadata';

describe('localizeSchemaMetadata', () => {
  it('recursively localizes only title and description fields', () => {
    const i18n = {
      t: jest.fn((key: string, options?: Record<string, unknown>) => {
        return `${String(options?.lang)}:${String(options?.ns)}:${key}`;
      }),
    } as unknown as I18nService;
    const schema = {
      type: 'object',
      title: 'Root title',
      description: 'Root description',
      default: 'Root title',
      properties: {
        prompt: {
          type: 'string',
          title: 'Prompt',
          description: 'Prompt description',
          default: 'Prompt',
        },
        nested: {
          type: 'array',
          items: {
            type: 'object',
            title: 'Nested object',
            description: 'Nested object description',
            properties: {
              label: {
                type: 'string',
                title: 'Label',
                description: 'Label description',
              },
            },
          },
        },
      },
    };
    const localized = localizeSchemaMetadata(schema, {
      i18n,
      ns: 'ai_generate_text',
      lang: 'fr',
    });

    expect(localized).toEqual({
      ...schema,
      title: 'fr:ai_generate_text:Root title',
      description: 'fr:ai_generate_text:Root description',
      properties: {
        ...schema.properties,
        prompt: {
          ...schema.properties.prompt,
          title: 'fr:ai_generate_text:Prompt',
          description: 'fr:ai_generate_text:Prompt description',
        },
        nested: {
          ...schema.properties.nested,
          items: {
            ...schema.properties.nested.items,
            title: 'fr:ai_generate_text:Nested object',
            description: 'fr:ai_generate_text:Nested object description',
            properties: {
              ...schema.properties.nested.items.properties,
              label: {
                ...schema.properties.nested.items.properties.label,
                title: 'fr:ai_generate_text:Label',
                description: 'fr:ai_generate_text:Label description',
              },
            },
          },
        },
      },
    });
    expect(localized.default).toBe('Root title');
    expect(localized.properties.prompt.default).toBe('Prompt');
    expect(i18n.t).toHaveBeenCalledWith('Prompt', {
      ns: 'ai_generate_text',
      lang: 'fr',
      defaultValue: 'Prompt',
    });
  });

  it('returns a deep-cloned schema and leaves source untouched', () => {
    const i18n = {
      t: jest.fn((key: string, options?: Record<string, unknown>) => {
        return options?.defaultValue ?? key;
      }),
    } as unknown as I18nService;
    const schema = {
      type: 'object',
      properties: {
        setting: {
          type: 'string',
          title: 'Setting title',
        },
      },
      anyOf: [{ description: 'Choice description' }],
    };
    const schemaSnapshot = JSON.parse(JSON.stringify(schema)) as typeof schema;
    const localized = localizeSchemaMetadata(schema, {
      i18n,
      ns: 'web',
    });

    expect(schema).toEqual(schemaSnapshot);
    expect(localized).toEqual(schemaSnapshot);
    expect(localized).not.toBe(schema);
    expect(localized.properties).not.toBe(schema.properties);
    expect(localized.anyOf).not.toBe(schema.anyOf);
    expect(localized.anyOf[0]).not.toBe(schema.anyOf[0]);
  });
});
