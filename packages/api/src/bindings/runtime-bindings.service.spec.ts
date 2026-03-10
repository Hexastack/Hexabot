/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { resolveDynamicProviders } from 'nestjs-dynamic-providers';
import { z } from 'zod';

import { BindingsModule } from '@/bindings/bindings.module';
import { createBindingKind } from '@/bindings/create-binding-kind';
import { aiModelBindingSchema } from '@/extensions/actions/ai/model.binding';
import { aiToolBindingSchema } from '@/extensions/actions/ai/tools.binding';
import { LoggerModule } from '@/logger/logger.module';

import { RuntimeBindingsService } from './runtime-bindings.service';

const weatherBindingSchema = z.strictObject({
  city: z.string().min(1),
});

describe('RuntimeBindingsService', () => {
  let moduleRef: TestingModule | undefined;
  const runtimeBindingsService = new RuntimeBindingsService();

  beforeAll(async () => {
    await resolveDynamicProviders();
  });

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
      imports: [LoggerModule, BindingsModule],
      providers: [RuntimeBindingsService],
    }).compile();
    await moduleRef.init();

    const service = moduleRef.get(RuntimeBindingsService);
    service.register({
      kind: 'tools',
      schema: aiToolBindingSchema,
      multiple: true,
    });
    service.register({
      kind: 'model',
      schema: aiModelBindingSchema,
      multiple: false,
    });
    const definitions = service.getAllSchemaDefinitions();

    expect(definitions.tools).toBeDefined();
    expect(definitions.model).toBeDefined();
    expect(definitions.tools.multiple).toBe(true);
    expect(definitions.model.multiple).toBe(false);
    expect(definitions.tools.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    expect(definitions.model.schema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    const toolsDefinition = definitions.tools.schema as
      | { properties?: Record<string, { type?: string }> }
      | undefined;
    const modelDefinition = definitions.model.schema as
      | { properties?: Record<string, { type?: string }> }
      | undefined;

    expect(toolsDefinition?.properties?.action?.type).toBe('string');
    expect(modelDefinition?.properties?.provider?.type).toBe('string');
    expect(modelDefinition?.properties?.model_id?.type).toBe('string');
  });

  it('fails fast when registering duplicate binding kinds', () => {
    const duplicateKind = `weather_duplicate_${Date.now()}`;

    runtimeBindingsService.register({
      kind: duplicateKind,
      schema: weatherBindingSchema,
      multiple: false,
    });

    expect(() =>
      runtimeBindingsService.register({
        kind: duplicateKind,
        schema: weatherBindingSchema,
        multiple: false,
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
      imports: [LoggerModule, BindingsModule],
      providers: [RuntimeBindingsService, CustomWeatherBindingProvider],
    }).compile();
    await moduleRef.init();

    const definitions = moduleRef
      .get(RuntimeBindingsService)
      .getAllSchemaDefinitions();

    expect(definitions[customKind]).toBeDefined();
    expect(definitions[customKind]?.multiple).toBe(false);
  });
});
