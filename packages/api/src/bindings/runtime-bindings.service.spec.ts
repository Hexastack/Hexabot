/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { z } from 'zod';

import { BindingsModule } from '@/bindings/bindings.module';
import { createBindingKind } from '@/bindings/create-binding-kind';
import { aiMcpToolBindingSchema } from '@/extensions/actions/ai/mcp.binding';
import { aiMemoryBindingSchema } from '@/extensions/actions/ai/memory.binding';
import { aiModelBindingSchema } from '@/extensions/actions/ai/model.binding';
import { aiToolBindingSchema } from '@/extensions/actions/ai/tools.binding';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerModule } from '@/logger/logger.module';
import { I18nTestingModule } from '@/utils/test/modules/i18n-testing.module';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';

import { RuntimeBindingsService } from './runtime-bindings.service';

const weatherBindingSchema = z.strictObject({
  city: z.string().min(1),
});

describe('RuntimeBindingsService', () => {
  let moduleRef: TestingModule | undefined;
  const runtimeBindingsService = new RuntimeBindingsService(
    I18nServiceProvider.useValue as unknown as I18nService,
  );

  beforeEach(() => {
    runtimeBindingsService.reset();
  });

  afterEach(async () => {
    await moduleRef?.close();
    moduleRef = undefined;
  });

  it('throws when runtime binding kinds are requested before bootstrap', () => {
    expect(() => runtimeBindingsService.getAllSchemaDefinitions()).toThrow(
      /Runtime binding kinds registry is empty while resolving workflow runtime binding schema definitions/,
    );
  });

  it('should expose JSON schema definitions for runtime bindings', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [I18nTestingModule, LoggerModule, BindingsModule],
      providers: [RuntimeBindingsService, I18nServiceProvider],
    }).compile();
    await moduleRef.init();

    const service = moduleRef.get(RuntimeBindingsService);
    service.register({
      kind: 'tools',
      schema: aiToolBindingSchema,
      multiple: true,
      color: '#f59e0b',
      icon: 'Wrench',
      supportedBindings: ['tools', 'model', 'memory'],
      actionPolicy: 'required',
    });
    service.register({
      kind: 'model',
      schema: aiModelBindingSchema,
      multiple: false,
      color: '#ad46fc',
      icon: 'Brain',
      supportedBindings: [],
      actionPolicy: 'forbidden',
    });
    service.register({
      kind: 'memory',
      schema: aiMemoryBindingSchema,
      multiple: true,
      color: '#0ea5e9',
      icon: 'Database',
      supportedBindings: [],
      actionPolicy: 'forbidden',
    });
    service.register({
      kind: 'mcp',
      schema: aiMcpToolBindingSchema,
      multiple: true,
      color: '#14b8a6',
      icon: 'Plug',
      supportedBindings: [],
      actionPolicy: 'forbidden',
    });
    const definitions = service.getAllSchemaDefinitions();

    expect(definitions.tools).toBeDefined();
    expect(definitions.model).toBeDefined();
    expect(definitions.memory).toBeDefined();
    expect(definitions.mcp).toBeDefined();
    expect(definitions.tools.multiple).toBe(true);
    expect(definitions.model.multiple).toBe(false);
    expect(definitions.memory.multiple).toBe(true);
    expect(definitions.mcp.multiple).toBe(true);
    expect(definitions.tools.color).toBe('#f59e0b');
    expect(definitions.tools.icon).toBe('Wrench');
    expect(definitions.model.color).toBe('#ad46fc');
    expect(definitions.model.icon).toBe('Brain');
    expect(definitions.memory.color).toBe('#0ea5e9');
    expect(definitions.memory.icon).toBe('Database');
    expect(definitions.mcp.color).toBe('#14b8a6');
    expect(definitions.mcp.icon).toBe('Plug');
    expect(definitions.tools.supportedBindings).toEqual([
      'tools',
      'model',
      'memory',
    ]);
    expect(definitions.model.supportedBindings).toEqual([]);
    expect(definitions.memory.supportedBindings).toEqual([]);
    expect(definitions.mcp.supportedBindings).toEqual([]);
    expect(definitions.tools.actionPolicy).toBe('required');
    expect(definitions.model.actionPolicy).toBe('forbidden');
    expect(definitions.memory.actionPolicy).toBe('forbidden');
    expect(definitions.mcp.actionPolicy).toBe('forbidden');
    expect(definitions.tools.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    expect(definitions.model.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    expect(definitions.memory.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    expect(definitions.mcp.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    const toolsDefinition = definitions.tools.schema as
      | {
          properties?: Record<string, { type?: string }>;
          additionalProperties?: unknown;
        }
      | undefined;
    const mcpToolsDefinition = definitions.mcp.schema as
      | {
          properties?: Record<
            string,
            {
              type?: string;
              'ui:widget'?: string;
              'ui:options'?: Record<string, unknown>;
            }
          >;
        }
      | undefined;
    const modelDefinition = definitions.model.schema as
      | { properties?: Record<string, { type?: string }> }
      | undefined;
    const memoryDefinition = definitions.memory.schema as
      | { properties?: Record<string, { type?: string }> }
      | undefined;

    expect(toolsDefinition?.properties?.action).toBeUndefined();
    expect(toolsDefinition?.additionalProperties).toBeDefined();
    expect(mcpToolsDefinition?.properties?.server_id?.type).toBe('string');
    expect(mcpToolsDefinition?.properties?.tool_names?.type).toBe('array');
    expect(mcpToolsDefinition?.properties?.tool_names?.['ui:widget']).toBe(
      'AutoCompleteWidget',
    );
    expect(
      mcpToolsDefinition?.properties?.tool_names?.['ui:options'],
    ).toMatchObject({
      methodName: 'getMcpTools',
      labelKey: 'name',
      idFormPath: 'server_id',
      disableSearch: true,
    });
    expect(modelDefinition?.properties?.provider?.type).toBe('string');
    expect(modelDefinition?.properties?.model_id?.type).toBe('string');
    expect(memoryDefinition?.properties?.definition_id?.type).toBe('string');
  });

  it('fails fast when registering duplicate binding kinds', () => {
    const duplicateKind = `weather_duplicate_${Date.now()}`;

    runtimeBindingsService.register({
      kind: duplicateKind,
      schema: weatherBindingSchema,
      multiple: false,
      color: '#22c55e',
      icon: 'CloudSun',
    });

    expect(() =>
      runtimeBindingsService.register({
        kind: duplicateKind,
        schema: weatherBindingSchema,
        multiple: false,
        color: '#22c55e',
        icon: 'CloudSun',
      }),
    ).toThrow(
      new RegExp(
        `Runtime binding kind \"${duplicateKind}\" is already registered`,
      ),
    );
  });

  it('registers custom binding kinds discovered as dynamic providers', async () => {
    const customKind = `weather_custom_${Date.now()}`;
    const CustomWeatherBindingProvider = createBindingKind({
      kind: customKind,
      schema: weatherBindingSchema,
      multiple: false,
    });

    moduleRef = await Test.createTestingModule({
      imports: [I18nTestingModule, LoggerModule, BindingsModule],
      providers: [
        RuntimeBindingsService,
        CustomWeatherBindingProvider,
        I18nServiceProvider,
      ],
    }).compile();
    await moduleRef.init();

    const definitions = moduleRef
      .get(RuntimeBindingsService)
      .getAllSchemaDefinitions();

    expect(definitions[customKind]).toBeDefined();
    expect(definitions[customKind]?.multiple).toBe(false);
    expect(definitions[customKind]?.supportedBindings).toEqual([]);
    expect(definitions[customKind]?.actionPolicy).toBe('forbidden');
  });
});
