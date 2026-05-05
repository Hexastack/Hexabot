/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CallWorkflowAction } from '@/extensions/actions/workflow/call-workflow.action';
import { LoggerModule } from '@/logger/logger.module';
import { DummyAction } from '@/utils/test/dummy/dummy.action';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import { buildTestingMocks } from '@/utils/test/utils';
import { WorkflowType } from '@/workflow/types';

import { ActionService } from './actions.service';
import { BaseAction } from './base-action';

describe('ActionService', () => {
  let actionService: ActionService;
  let dummyAction: InstanceType<typeof DummyAction>;
  let callWorkflowAction: InstanceType<typeof CallWorkflowAction>;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      providers: [
        ActionService,
        DummyAction,
        CallWorkflowAction,
        I18nServiceProvider,
      ],
      imports: [LoggerModule],
    });
    [actionService, dummyAction, callWorkflowAction] = await getMocks([
      ActionService,
      DummyAction,
      CallWorkflowAction,
    ]);
    await dummyAction.onModuleInit();
    await callWorkflowAction.onModuleInit();
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

    expect(definition.inputSchema.$schema).toBe(
      'http://json-schema.org/draft-07/schema#',
    );
    const inputDefinition = definition.inputSchema as
      | { properties?: Record<string, { type?: string }> }
      | undefined;
    const outputDefinition = definition.outputSchema as
      | { properties?: Record<string, { type?: string }> }
      | undefined;

    expect(inputDefinition?.properties?.message?.type).toBe('string');
    expect(outputDefinition?.properties?.echoed?.type).toBe('string');
    expect(definition.settingSchema).toBeDefined();
    expect(definition.supportedBindings).toEqual([]);
  });

  it('should expose a registry keyed by action name', () => {
    const registry = actionService.getRegistry();
    expect(registry[dummyAction.getName()]).toBe(dummyAction);
  });

  it('adds workflow type filtering metadata to call_workflow autocomplete schema', () => {
    const definitions = actionService.getAllSchemaDefinitions(
      WorkflowType.conversational,
    );
    const definition = definitions.find(({ name }) => name === 'call_workflow');
    const inputDefinition = definition?.inputSchema as
      | {
          properties?: Record<
            string,
            { 'ui:options'?: Record<string, unknown> }
          >;
        }
      | undefined;

    expect(inputDefinition?.properties?.workflow_id?.['ui:options']).toEqual(
      expect.objectContaining({
        entity: 'Workflow',
        valueKey: 'id',
        labelKey: 'name',
        where: { type: WorkflowType.conversational },
      }),
    );
  });

  it('should fetch an action by name', () => {
    const action = actionService.get('dummy_action');
    expect(action).toBeInstanceOf(DummyAction);
  });
});
