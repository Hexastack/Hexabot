/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Workflow as AgentWorkflow } from '@hexabot-ai/agentic';
import { TestingModule } from '@nestjs/testing';

import { ActionService } from '@/actions/actions.service';
import EventWrapper from '@/channel/lib/EventWrapper';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { LoggerService } from '@/logger/logger.service';
import { messagingWorkflowDefinition } from '@/utils/test/fixtures/workflow';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { WorkflowRunFull } from '../dto/workflow-run.dto';
import { Workflow } from '../dto/workflow.dto';

import { AgenticService } from './agentic.service';
import { WorkflowContext } from './workflow-context';
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
): EventWrapper<any, any> => {
  const message = overrides.message ?? { text: 'Hello from user' };
  const handler = {
    getName: jest.fn(() => 'web'),
    sendMessage: jest.fn().mockResolvedValue({ mid: 'outgoing-mid' }),
  };

  return {
    getSender: jest.fn(() => subscriber),
    getChannelData: jest.fn(() => overrides.channelData ?? { name: 'web' }),
    getMessageType: jest.fn(() => overrides.messageType ?? 'text'),
    getEventType: jest.fn(() => overrides.eventType ?? 'message'),
    getPayload: jest.fn(() => overrides.payload ?? { payload: 'foo' }),
    getMessage: jest.fn(() => message),
    getText: jest.fn(() => overrides.text ?? (message as any).text ?? ''),
    getId: jest.fn(() => overrides.id ?? 'mid-123'),
    getHandler: jest.fn(() => handler),
  } as unknown as EventWrapper<any, any>;
};

describe('AgenticService', () => {
  let testingModule: TestingModule;
  let service: AgenticService;
  let workflowService: jest.Mocked<WorkflowService>;
  let workflowRunService: jest.Mocked<WorkflowRunService>;
  let actionService: jest.Mocked<ActionService>;
  let workflowContext: jest.Mocked<WorkflowContext>;
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
      findSuspendedRunBySubscriber: jest.fn(),
      create: jest.fn(),
      markRunning: jest.fn(),
      markSuspended: jest.fn(),
      markFinished: jest.fn(),
      markFailed: jest.fn(),
      updateOne: jest.fn(),
    } as unknown as jest.Mocked<WorkflowRunService>;
    actionService = {
      getAll: jest.fn(() => mockActions),
    } as unknown as jest.Mocked<ActionService>;
    workflowContext = new WorkflowContext() as jest.Mocked<WorkflowContext>;
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
        { provide: WorkflowContext, useValue: workflowContext },
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

    await service.handleMessageEvent(event);

    expect(logger.warn).toHaveBeenCalledWith(
      'Skipping workflow execution due to missing subscriber on event',
    );
    expect(
      workflowRunService.findSuspendedRunBySubscriber,
    ).not.toHaveBeenCalled();
  });

  it('resumes a suspended run and persists suspension state', async () => {
    const subscriber = { id: 'subscriber-1' } as Subscriber;
    const resumeMessage = { text: 'Resume message' };
    const event = buildEvent(subscriber, { message: resumeMessage });
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
      subscriber,
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
      input: { fromState: true },
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
      state: runnerState,
    };
    const workflowInstance = {
      buildRunnerFromState: jest.fn().mockResolvedValue(runner),
      buildAsyncRunner: jest.fn(),
    };
    (AgentWorkflow as any).fromDefinition.mockReturnValue(workflowInstance);
    workflowRunService.findSuspendedRunBySubscriber.mockResolvedValue(run);
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

    await service.handleMessageEvent(event);

    const expectedContext = {
      stored: true,
      persisted: 'context',
      subscriberId: subscriber.id,
      conversationId: run.id,
      runId: run.id,
    };

    expect(workflowInstance.buildRunnerFromState).toHaveBeenCalledWith({
      state: {
        input: run.input,
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
      lastResumeData: run.lastResumeData,
    });
    expect(workflowRunService.markRunning).toHaveBeenCalledWith(run.id, {
      lastResumeData: resumeMessage,
      snapshot: run.snapshot,
      memory: run.memory,
      context: expectedContext,
    });
    expect(runner.resume).toHaveBeenCalledWith({ resumeData: resumeMessage });
    expect(workflowRunService.markSuspended).toHaveBeenCalledWith(run.id, {
      stepId: 'prompt_next_step',
      reason: 'awaiting_user',
      data: { resume: true },
      snapshot: { status: 'suspended', actions: {} },
      memory: runnerState.memory,
      context: expectedContext,
      lastResumeData: resumeMessage,
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
      subscriber,
      input: expectedInput,
      output: null,
      memory: null,
      context: null,
      metadata: null,
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
      state: runnerState,
    };
    const workflowInstance = {
      buildRunnerFromState: jest.fn(),
      buildAsyncRunner: jest.fn().mockResolvedValue(runner),
    };
    (AgentWorkflow as any).fromDefinition.mockReturnValue(workflowInstance);
    workflowRunService.findSuspendedRunBySubscriber.mockResolvedValue(null);
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

    await service.handleMessageEvent(event);

    const expectedContext = {
      existing: 'context',
      subscriberId: subscriber.id,
      conversationId: populatedRun.id,
      runId: populatedRun.id,
    };
    expect(workflowRunService.create).toHaveBeenCalledWith({
      workflow: workflow.id,
      subscriber: subscriber.id,
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
    workflowRunService.findSuspendedRunBySubscriber.mockResolvedValueOnce(null);
    workflowService.pickWorkflow.mockResolvedValueOnce(null);

    await service.handleMessageEvent(event);

    expect(logger.warn).toHaveBeenCalledWith(
      'No workflow available to handle incoming event',
    );
    expect(workflowService.pickWorkflow).toHaveBeenCalled();
    expect(workflowRunService.create).not.toHaveBeenCalled();
  });
});
