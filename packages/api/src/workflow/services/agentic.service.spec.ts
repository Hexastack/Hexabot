/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Workflow as AgentWorkflow } from '@hexabot-ai/agentic';
import { TestingModule } from '@nestjs/testing';

import { ActionService } from '@/actions/actions.service';
import ConversationalEventWrapper from '@/channel/lib/ConversationalEventWrapper';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { LoggerService } from '@/logger/logger.service';
import { messagingWorkflowDefinition } from '@/utils/test/fixtures/workflow';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ConversationalWorkflowContext } from '../contexts/conversational-workflow.context';
import { WorkflowContextFactory } from '../contexts/workflow-context-factory';
import { WorkflowRunFull } from '../dto/workflow-run.dto';
import { Workflow } from '../dto/workflow.dto';
import { WorkflowType } from '../types';

import { AgenticService } from './agentic.service';
import { WorkflowRunService } from './workflow-run.service';
import { WorkflowService } from './workflow.service';

jest.mock('@hexabot-ai/agentic', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('events');

  class MockWorkflow {
    static fromDefinition = jest.fn();

    buildRunnerFromState = jest.fn();

    buildAsyncRunner = jest.fn();
  }

  class MockWorkflowEventEmitter extends EventEmitter {}

  class MockBaseWorkflowContext {
    state: Record<string, unknown>;

    workflow: any;

    constructor(initial?: Record<string, unknown>) {
      this.state = initial ?? {};
    }

    attachWorkflowRuntime(runtime: any) {
      this.workflow = runtime;
    }
  }

  return {
    Workflow: MockWorkflow,
    WorkflowEventEmitter: MockWorkflowEventEmitter,
    BaseWorkflowContext: MockBaseWorkflowContext,
  };
});

type EventOverrides = Partial<{
  channelData: Record<string, unknown>;
  messageType: unknown;
  eventType: unknown;
  payload: unknown;
  message: unknown;
  text: string;
  id: string | undefined;
}>;

const buildEvent = (
  subscriber?: Subscriber,
  overrides: EventOverrides = {},
): ConversationalEventWrapper<any, any> => {
  const message = overrides.message ?? { text: 'Hello from user' };
  const channelData = overrides.channelData ?? { name: 'web' };
  const messageType = overrides.messageType ?? 'text';
  const eventType = overrides.eventType ?? 'message';
  const payload = overrides.payload ?? { payload: 'foo' };
  const id = overrides.id ?? 'mid-123';
  const handler = {
    getName: jest.fn(() => channelData.name ?? 'web'),
    sendMessage: jest.fn().mockResolvedValue({ mid: 'outgoing-mid' }),
  };

  return {
    triggerType: WorkflowType.conversational,
    getInitiator: jest.fn(() => subscriber),
    getChannelData: jest.fn(() => channelData),
    getMessageType: jest.fn(() => messageType),
    getEventType: jest.fn(() => eventType),
    getPayload: jest.fn(() => payload),
    getMessage: jest.fn(() => message),
    getText: jest.fn(() => overrides.text ?? (message as any).text ?? ''),
    getId: jest.fn(() => id),
    getHandler: jest.fn(() => handler),
    getMetadata: jest.fn(() => ({ channel: channelData })),
    getContextData: jest.fn(() => ({
      messageId: id,
      eventType,
      messageType,
    })),
    buildInput: jest.fn(() => {
      const input: Record<string, unknown> = {
        channel: channelData,
        message_type: messageType,
        event_type: eventType,
        sender: subscriber,
        payload,
        message,
        text: overrides.text ?? (message as any).text ?? '',
      };

      if (id) {
        input.mid = id;
      }

      return input;
    }),
  } as unknown as ConversationalEventWrapper<any, any>;
};

describe('AgenticService', () => {
  let testingModule: TestingModule;
  let service: AgenticService;
  let workflowService: jest.Mocked<WorkflowService>;
  let workflowRunService: jest.Mocked<WorkflowRunService>;
  let actionService: jest.Mocked<ActionService>;
  let workflowContextFactory: jest.Mocked<WorkflowContextFactory>;
  let workflowContext: jest.Mocked<ConversationalWorkflowContext>;
  let logger: jest.Mocked<LoggerService>;

  const mockActions = [
    { getName: () => 'send_text_message' },
    { getName: () => 'send_quick_replies' },
  ] as any[];

  beforeAll(async () => {
    workflowService = {
      pickWorkflow: jest.fn(),
    } as unknown as jest.Mocked<WorkflowService>;
    workflowRunService = {
      findOneAndPopulate: jest.fn(),
      findSuspendedRunByInitiator: jest.fn(),
      create: jest.fn(),
      markRunning: jest.fn(),
      markSuspended: jest.fn(),
      markFinished: jest.fn(),
      markFailed: jest.fn(),
      updateOne: jest.fn(),
    } as unknown as jest.Mocked<WorkflowRunService>;
    actionService = {
      getAll: jest.fn(() => mockActions),
      getRegistry: jest.fn(() =>
        Object.fromEntries(
          mockActions.map((action) => [action.getName(), action]),
        ),
      ),
    } as unknown as jest.Mocked<ActionService>;
    workflowContext =
      new ConversationalWorkflowContext() as jest.Mocked<ConversationalWorkflowContext>;
    workflowContextFactory = {
      create: jest.fn(async (run, event) => {
        if (run) {
          return workflowContext.buildFromRun(run, event);
        }

        workflowContext.state = {};
        (workflowContext as any).event = event;

        return workflowContext;
      }),
    } as unknown as jest.Mocked<WorkflowContextFactory>;
    logger = {
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    const testing = await buildTestingMocks({
      providers: [
        AgenticService,
        { provide: WorkflowService, useValue: workflowService },
        { provide: WorkflowRunService, useValue: workflowRunService },
        { provide: ActionService, useValue: actionService },
        { provide: WorkflowContextFactory, useValue: workflowContextFactory },
        { provide: LoggerService, useValue: logger },
      ],
    });

    testingModule = testing.module;
    [service] = await testing.getMocks([AgenticService]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    workflowContext.state = {};
  });

  afterAll(async () => {
    await testingModule?.close();
    await closeTypeOrmConnections();
  });

  it('logs a warning and skips when no subscriber is present', async () => {
    const event = buildEvent(undefined);

    await service.handleEvent(event);

    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping workflow execution due to missing event initiator',
    );
    expect(
      workflowRunService.findSuspendedRunByInitiator,
    ).not.toHaveBeenCalled();
  });

  it('resumes a suspended run and persists suspension state', async () => {
    const subscriber = { id: 'subscriber-1' } as Subscriber;
    const resumeMessage = { text: 'Resume message' };
    const event = buildEvent(subscriber, { message: resumeMessage });
    const latestInput = {
      channel: { name: 'web' },
      message_type: 'text',
      event_type: 'message',
      sender: subscriber,
      payload: { payload: 'foo' },
      message: resumeMessage,
      text: resumeMessage.text,
      mid: 'mid-123',
    };
    const mergedInput = {
      foo: 'bar',
      channel: { name: 'web' },
      message_type: 'text',
      event_type: 'message',
      sender: subscriber,
      payload: { payload: 'foo' },
      message: resumeMessage,
      text: resumeMessage.text,
      mid: 'mid-123',
    };
    const workflow: Workflow = {
      id: 'workflow-1',
      name: messagingWorkflowDefinition.workflow.name,
      version: messagingWorkflowDefinition.workflow.version,
      definition: messagingWorkflowDefinition,
      description: messagingWorkflowDefinition.workflow.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Workflow;
    const run: WorkflowRunFull = {
      id: 'run-1',
      status: 'suspended',
      workflow,
      triggeredBy: subscriber,
      input: { foo: 'bar' },
      output: { prev: true },
      memory: { cache: true },
      context: { stored: true },
      snapshot: { status: 'suspended', actions: {} },
      metadata: {
        state: {
          iteration: 1,
          accumulator: { count: 1 },
          iterationStack: ['initial'],
        },
        note: 'keep',
      },
      suspendedStep: 'prompt_next_step',
      suspensionReason: 'awaiting_input',
      suspensionData: { previous: true },
      lastResumeData: { prev: 'data' },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WorkflowRunFull;
    const runnerState = {
      input: mergedInput,
      output: { collected: true },
      memory: { resumed: true },
      iteration: 3,
      accumulator: { loops: 2 },
      iterationStack: ['flow'],
    };
    const runner = {
      resume: jest.fn().mockResolvedValue({
        status: 'suspended',
        step: { id: 'prompt_next_step' },
        reason: 'awaiting_user',
        data: { resume: true },
        snapshot: { status: 'suspended', actions: {} },
      }),
      getSnapshot: jest
        .fn()
        .mockReturnValue({ status: 'snapshot', actions: {} }),
      getState: jest.fn(() => runnerState),
    };
    const workflowInstance = {
      buildRunnerFromState: jest.fn().mockResolvedValue(runner),
      buildAsyncRunner: jest.fn(),
    };
    (AgentWorkflow as any).fromDefinition.mockReturnValue(workflowInstance);
    workflowRunService.findSuspendedRunByInitiator.mockResolvedValue(run);
    workflowRunService.markRunning.mockResolvedValue(run as any);
    workflowRunService.markSuspended.mockResolvedValue({
      ...run,
      status: 'suspended',
    } as any);
    workflowRunService.updateOne.mockResolvedValue({
      ...run,
      status: 'suspended',
    } as any);
    workflowContext.state = { persisted: 'context' };

    await service.handleEvent(event);

    const expectedContext = {
      stored: true,
      initiatorId: subscriber.id,
      workflowId: workflow.id,
      runId: run.id,
    };

    expect(workflowInstance.buildRunnerFromState).toHaveBeenCalledWith({
      state: {
        input: mergedInput,
        memory: run.memory,
        output: run.output,
        iterationStack: ['initial'],
        iteration: 1,
        accumulator: { count: 1 },
      },
      context: workflowContext,
      snapshot: run.snapshot,
      suspension: {
        stepId: run.suspendedStep,
        reason: run.suspensionReason,
        data: run.suspensionData,
      },
      runId: run.id,
      lastResumeData: latestInput,
    });
    expect(workflowRunService.markRunning).toHaveBeenCalledWith(run.id, {
      lastResumeData: latestInput,
      snapshot: run.snapshot,
      memory: run.memory,
      context: expectedContext,
    });
    expect(runner.resume).toHaveBeenCalledWith({
      resumeData: latestInput,
    });
    expect(workflowRunService.markSuspended).toHaveBeenCalledWith(run.id, {
      stepId: 'prompt_next_step',
      reason: 'awaiting_user',
      data: { resume: true },
      snapshot: { status: 'suspended', actions: {} },
      memory: runnerState.memory,
      context: expectedContext,
      lastResumeData: latestInput,
    });
    expect(workflowRunService.updateOne).toHaveBeenCalledWith(run.id, {
      input: runnerState.input,
      output: runnerState.output,
      memory: runnerState.memory,
      metadata: {
        note: 'keep',
        state: {
          iteration: runnerState.iteration,
          accumulator: runnerState.accumulator,
          iterationStack: runnerState.iterationStack,
        },
      },
      context: expectedContext,
    });
  });

  it('starts a new run when no suspension exists', async () => {
    const subscriber = { id: 'subscriber-2' } as Subscriber;
    const event = buildEvent(subscriber, {
      channelData: { name: 'web', channel: 'test' },
      message: { text: 'Hello there' },
      id: 'evt-1',
    });
    const expectedInput = {
      channel: { name: 'web', channel: 'test' },
      message_type: 'text',
      event_type: 'message',
      sender: subscriber,
      payload: { payload: 'foo' },
      message: { text: 'Hello there' },
      text: 'Hello there',
      mid: 'evt-1',
    };
    const workflow: Workflow = {
      id: 'workflow-2',
      name: messagingWorkflowDefinition.workflow.name,
      version: messagingWorkflowDefinition.workflow.version,
      definition: {
        ...messagingWorkflowDefinition,
        memory: { seen: false },
        context: { greeting: true },
      },
      description: messagingWorkflowDefinition.workflow.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Workflow;
    const createdRun = { id: 'run-2' } as any;
    const populatedRun: WorkflowRunFull = {
      id: createdRun.id,
      status: 'idle',
      workflow,
      triggeredBy: subscriber,
      input: expectedInput,
      output: null,
      memory: workflow.definition.memory,
      context: workflow.definition.context,
      metadata: { channel: { name: 'web', channel: 'test' } },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WorkflowRunFull;
    const runnerState = {
      input: { hydrated: true },
      output: { fromState: true },
      memory: { started: true },
      iterationStack: [],
      iteration: 0,
      accumulator: undefined,
    };
    const runner = {
      start: jest.fn().mockResolvedValue({
        status: 'finished',
        snapshot: { status: 'finished', actions: {} },
        output: { result: 'done' },
      }),
      getSnapshot: jest
        .fn()
        .mockReturnValue({ status: 'finished', actions: {} }),
      getState: jest.fn(() => runnerState),
    };
    const workflowInstance = {
      buildRunnerFromState: jest.fn(),
      buildAsyncRunner: jest.fn().mockResolvedValue(runner),
    };
    (AgentWorkflow as any).fromDefinition.mockReturnValue(workflowInstance);
    workflowRunService.findSuspendedRunByInitiator.mockResolvedValue(null);
    workflowService.pickWorkflow.mockResolvedValue(workflow);
    workflowRunService.findOneAndPopulate.mockResolvedValue(populatedRun);
    workflowRunService.create.mockResolvedValue(createdRun);
    workflowRunService.markRunning.mockResolvedValue({
      ...populatedRun,
      status: 'running',
    } as any);
    workflowRunService.markFinished.mockResolvedValue({
      ...populatedRun,
      status: 'finished',
    } as any);
    workflowRunService.updateOne.mockResolvedValue({
      ...populatedRun,
      status: 'finished',
    } as any);
    workflowContext.state = { existing: 'context' };

    await service.handleEvent(event);

    const expectedContext = {
      greeting: true,
      initiatorId: subscriber.id,
      workflowId: workflow.id,
      runId: populatedRun.id,
    };
    expect(workflowRunService.create).toHaveBeenCalledWith({
      workflow: workflow.id,
      triggeredBy: subscriber.id,
      input: expectedInput,
      memory: workflow.definition.memory,
      context: workflow.definition.context,
      metadata: { channel: { name: 'web', channel: 'test' } },
    });
    expect(workflowInstance.buildAsyncRunner).toHaveBeenCalledWith({
      runId: populatedRun.id,
    });
    expect(workflowRunService.markRunning).toHaveBeenCalledWith(
      populatedRun.id,
      {
        snapshot: null,
        memory: workflow.definition.memory,
        context: expectedContext,
      },
    );
    expect(runner.start).toHaveBeenCalledWith({
      inputData: expectedInput,
      context: workflowContext,
      memory: workflow.definition.memory,
    });
    expect(workflowRunService.markFinished).toHaveBeenCalledWith(
      populatedRun.id,
      {
        snapshot: { status: 'finished', actions: {} },
        memory: runnerState.memory,
        context: expectedContext,
        output: { result: 'done' },
      },
    );
    expect(workflowRunService.updateOne).toHaveBeenCalledWith(populatedRun.id, {
      input: runnerState.input,
      output: { result: 'done' },
      memory: runnerState.memory,
      metadata: {
        channel: { name: 'web', channel: 'test' },
        state: {
          iteration: runnerState.iteration,
          accumulator: runnerState.accumulator,
          iterationStack: runnerState.iterationStack,
        },
      },
      context: expectedContext,
    });
  });

  it('warns when no workflow is available', async () => {
    const subscriber = { id: 'subscriber-3' } as Subscriber;
    const event = buildEvent(subscriber);
    workflowRunService.findSuspendedRunByInitiator.mockResolvedValueOnce(null);
    workflowService.pickWorkflow.mockResolvedValueOnce(null);

    await service.handleEvent(event);

    expect(logger.warn).toHaveBeenCalledWith(
      'No workflow available to handle incoming event',
    );
    expect(workflowService.pickWorkflow).toHaveBeenCalled();
    expect(workflowRunService.create).not.toHaveBeenCalled();
  });

  it('persists failure results and metadata when runner reports failure', async () => {
    const subscriber = { id: 'subscriber-4' } as Subscriber;
    const event = buildEvent(subscriber, { id: 'evt-2' });
    const expectedInput = {
      channel: { name: 'web' },
      message_type: 'text',
      event_type: 'message',
      sender: subscriber,
      payload: { payload: 'foo' },
      message: { text: 'Hello from user' },
      text: 'Hello from user',
      mid: 'evt-2',
    };
    const workflow: Workflow = {
      id: 'workflow-4',
      name: messagingWorkflowDefinition.workflow.name,
      version: messagingWorkflowDefinition.workflow.version,
      definition: { ...messagingWorkflowDefinition, memory: { fresh: true } },
      description: messagingWorkflowDefinition.workflow.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Workflow;
    const createdRun = { id: 'run-4' } as any;
    const populatedRun: WorkflowRunFull = {
      id: createdRun.id,
      status: 'idle',
      workflow,
      triggeredBy: subscriber,
      input: expectedInput,
      output: { previous: true },
      memory: workflow.definition.memory,
      context: null,
      metadata: { channel: { name: 'web' } },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WorkflowRunFull;
    const runnerState = {
      input: { hydrated: true },
      output: { fallback: true },
      memory: { started: true },
      iterationStack: ['step'],
      iteration: 2,
      accumulator: { runs: 1 },
    };
    const runner = {
      start: jest.fn().mockResolvedValue({
        status: 'failed',
        snapshot: { status: 'failed', actions: {} },
        error: 'runner failure',
      }),
      getSnapshot: jest.fn(),
      getState: jest.fn(() => runnerState),
    };
    const workflowInstance = {
      buildRunnerFromState: jest.fn(),
      buildAsyncRunner: jest.fn().mockResolvedValue(runner),
    };
    (AgentWorkflow as any).fromDefinition.mockReturnValue(workflowInstance);
    workflowRunService.findSuspendedRunByInitiator.mockResolvedValue(null);
    workflowService.pickWorkflow.mockResolvedValue(workflow);
    workflowRunService.create.mockResolvedValue(createdRun);
    workflowRunService.findOneAndPopulate.mockResolvedValue(populatedRun);
    workflowRunService.markRunning.mockResolvedValue({
      ...populatedRun,
      status: 'running',
    } as any);
    workflowRunService.markFailed.mockResolvedValue({
      ...populatedRun,
      status: 'failed',
    } as any);
    workflowRunService.updateOne.mockResolvedValue({
      ...populatedRun,
      status: 'failed',
    } as any);
    workflowContext.state = { failure: 'context' };

    await service.handleEvent(event);

    const expectedContext = {
      initiatorId: subscriber.id,
      workflowId: workflow.id,
      runId: populatedRun.id,
    };

    expect(workflowInstance.buildAsyncRunner).toHaveBeenCalledWith({
      runId: populatedRun.id,
    });
    expect(runner.start).toHaveBeenCalledWith({
      inputData: expectedInput,
      context: workflowContext,
      memory: workflow.definition.memory,
    });
    expect(workflowRunService.markFailed).toHaveBeenCalledWith(
      populatedRun.id,
      {
        snapshot: { status: 'failed', actions: {} },
        memory: runnerState.memory,
        context: expectedContext,
        error: 'runner failure',
      },
    );
    expect(workflowRunService.updateOne).toHaveBeenCalledWith(populatedRun.id, {
      input: runnerState.input,
      output: runnerState.output,
      memory: runnerState.memory,
      metadata: {
        channel: { name: 'web' },
        state: {
          iteration: runnerState.iteration,
          accumulator: runnerState.accumulator,
          iterationStack: runnerState.iterationStack,
        },
      },
      context: expectedContext,
    });
  });

  it('marks run as failed when runner execution throws', async () => {
    const subscriber = { id: 'subscriber-5' } as Subscriber;
    const event = buildEvent(subscriber, { id: 'evt-3' });
    const workflow: Workflow = {
      id: 'workflow-5',
      name: messagingWorkflowDefinition.workflow.name,
      version: messagingWorkflowDefinition.workflow.version,
      definition: messagingWorkflowDefinition,
      description: messagingWorkflowDefinition.workflow.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Workflow;
    const createdRun = { id: 'run-5' } as any;
    const populatedRun: WorkflowRunFull = {
      id: createdRun.id,
      status: 'idle',
      workflow,
      triggeredBy: subscriber,
      input: {},
      output: null,
      memory: null,
      context: null,
      metadata: { channel: { name: 'web' } },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WorkflowRunFull;
    const runnerState = {
      input: { merged: true },
      output: { failed: true },
      memory: { temp: true },
      iterationStack: [],
      iteration: 0,
      accumulator: { attempts: 1 },
    };
    const error = new Error('runner crashed');
    const runner = {
      start: jest.fn().mockRejectedValue(error),
      getSnapshot: jest.fn().mockReturnValue({ status: 'failed', actions: {} }),
      getState: jest.fn(() => runnerState),
    };
    const workflowInstance = {
      buildRunnerFromState: jest.fn(),
      buildAsyncRunner: jest.fn().mockResolvedValue(runner),
    };
    (AgentWorkflow as any).fromDefinition.mockReturnValue(workflowInstance);
    workflowRunService.findSuspendedRunByInitiator.mockResolvedValue(null);
    workflowService.pickWorkflow.mockResolvedValue(workflow);
    workflowRunService.create.mockResolvedValue(createdRun);
    workflowRunService.findOneAndPopulate.mockResolvedValue(populatedRun);
    workflowRunService.markRunning.mockResolvedValue({
      ...populatedRun,
      status: 'running',
    } as any);
    workflowRunService.markFailed.mockResolvedValue({
      ...populatedRun,
      status: 'failed',
    } as any);
    workflowRunService.updateOne.mockResolvedValue({
      ...populatedRun,
      status: 'failed',
    } as any);
    workflowContext.state = { crash: 'context' };

    await service.handleEvent(event);

    const expectedContext = {
      initiatorId: subscriber.id,
      workflowId: workflow.id,
      runId: populatedRun.id,
    };

    expect(workflowRunService.markFailed).toHaveBeenCalledWith(
      populatedRun.id,
      {
        snapshot: { status: 'failed', actions: {} },
        memory: runnerState.memory,
        context: expectedContext,
        error: 'runner crashed',
      },
    );
    expect(workflowRunService.updateOne).toHaveBeenCalledWith(populatedRun.id, {
      input: runnerState.input,
      output: runnerState.output,
      memory: runnerState.memory,
      metadata: {
        channel: { name: 'web' },
        state: {
          iteration: runnerState.iteration,
          accumulator: runnerState.accumulator,
          iterationStack: runnerState.iterationStack,
        },
      },
      context: expectedContext,
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Unable to process incoming event through agentic workflow',
      error,
    );
  });
});
