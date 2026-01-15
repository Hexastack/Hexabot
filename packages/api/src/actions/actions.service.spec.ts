/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerModule } from '@/logger/logger.module';
import { DummyAction } from '@/utils/test/dummy/dummy.action';
import { buildTestingMocks } from '@/utils/test/utils';

import { ActionService } from './actions.service';
import { BaseAction } from './base-action';

describe('ActionService', () => {
  let actionService: ActionService;
  let dummyAction: InstanceType<typeof DummyAction>;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      providers: [ActionService, DummyAction],
      imports: [LoggerModule],
    });
    [actionService, dummyAction] = await getMocks([ActionService, DummyAction]);
    await dummyAction.onModuleInit();
  });

  afterAll(jest.clearAllMocks);

  it('should return all registered actions', () => {
    const actions = actionService.getAll();
    expect(actions.every((action) => action instanceof BaseAction)).toBe(true);
  });

  it('should expose JSON schema definitions for action IO and settings', () => {
    const definitions = actionService.getAllSchemaDefinitions();
    const dummyName = dummyAction.getName();
    const definition = definitions.find(({ name }) => name === dummyName);

    expect(definition).toBeDefined();
    if (!definition) {
      throw new Error(`Missing schema definition for ${dummyName}`);
    }

    const inputKey = `${dummyName}_input`;
    const outputKey = `${dummyName}_output`;
    const settingsKey = `${dummyName}_settings`;

    expect(definition.inputSchema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    const inputDefinition = definition.inputSchema.definitions?.[inputKey] as
      | { properties?: Record<string, { type?: string }> }
      | undefined;
    const outputDefinition = definition.outputSchema.definitions?.[
      outputKey
    ] as { properties?: Record<string, { type?: string }> } | undefined;

    expect(inputDefinition?.properties?.message?.type).toBe('string');
    expect(outputDefinition?.properties?.echoed?.type).toBe('string');
    expect(definition.settingsSchema.definitions?.[settingsKey]).toBeDefined();
  });

  it('should expose a registry keyed by action name', () => {
    const registry = actionService.getRegistry();
    expect(registry[dummyAction.getName()]).toBe(dummyAction);
  });

  it('should fetch an action by name', () => {
    const action = actionService.get('dummy_action');
    expect(action).toBeInstanceOf(DummyAction);
  });
});
