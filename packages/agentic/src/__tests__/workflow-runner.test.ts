import { z } from 'zod';

import { EventEmitter } from 'events';
import { defineAction } from '../action/action';
import { BaseWorkflowContext } from '../context';
import type { Settings, WorkflowDefinition } from '../dsl.types';
import { compileWorkflow } from '../workflow-compiler';
import type {
  WorkflowEventEmitterLike,
  WorkflowEventMap,
} from '../workflow-event-emitter';
import { WorkflowEventEmitter } from '../workflow-event-emitter';
import { WorkflowRunner } from '../workflow-runner';
import type { ExecutionState } from '../workflow-types';

class MemoryEmitter implements WorkflowEventEmitterLike<{}> {
  private listeners: Partial<{
    [K in keyof WorkflowEventMap]: Array<
      (payload: WorkflowEventMap[K]) => void
    >;
  }> = {};

  emit<K extends keyof WorkflowEventMap>(
    event: K,
    payload: WorkflowEventMap[K],
  ) {
    this.listeners[event]?.forEach((listener) => listener(payload));
    return true;
  }

  on<K extends keyof WorkflowEventMap>(
    event: K,
    listener: (payload: WorkflowEventMap[K]) => void,
  ) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(listener);
    return this;
  }
}

class TestMemoryContext extends BaseWorkflowContext<
  Record<string, unknown>,
  MemoryEmitter
> {
  constructor(initial?: Record<string, unknown>, emitter?: MemoryEmitter) {
    super(initial, emitter);
  }
}

class TestContext extends BaseWorkflowContext<
  Record<string, unknown>,
  WorkflowEventEmitter
> {
  constructor(
    initial?: Record<string, unknown>,
    emitter?: WorkflowEventEmitter,
  ) {
    super(initial, emitter);
  }
}

const baseRetries = {
  max_attempts: 1,
  backoff_ms: 0,
  max_delay_ms: 0,
  jitter: 0,
  multiplier: 1,
};
describe('WorkflowRunner', () => {
  it('executes parallel, conditional, and loop steps while tracking snapshots', async () => {
    const firstExecute = jest.fn(async () => ({ value: 'alpha' }));
    const secondExecute = jest.fn(async () => ({ value: 'beta' }));
    const echoExecute = jest.fn(async ({ input }) => ({
      message: String(input.message),
    }));

    const firstAction = defineAction<
      unknown,
      { value: string },
      TestContext,
      Settings
    >({
      name: 'first_action',
      inputSchema: z.any(),
      outputSchema: z.object({ value: z.string() }),
      execute: firstExecute,
    });
    const secondAction = defineAction<
      unknown,
      { value: string },
      TestContext,
      Settings
    >({
      name: 'second_action',
      inputSchema: z.any(),
      outputSchema: z.object({ value: z.string() }),
      execute: secondExecute,
    });
    const echoAction = defineAction<
      { message?: unknown },
      { message: string },
      TestContext,
      Settings
    >({
      name: 'echo_action',
      inputSchema: z.object({ message: z.any() }),
      outputSchema: z.object({ message: z.string() }),
      execute: echoExecute,
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'control_flow', version: '1.0.0' },
      defaults: { settings: { timeout_ms: 0, retries: baseRetries } },
      tasks: {
        first_task: {
          action: 'first_action',
          outputs: { value: '=$result.value' },
        },
        second_task: {
          action: 'second_action',
          outputs: { value: '=$result.value' },
        },
        branch_task: {
          action: 'echo_action',
          inputs: {
            message: '=$exists($iteration) ? $iteration.item : "conditional"',
          },
          outputs: { message: '=$result.message' },
        },
        loop_task: {
          action: 'echo_action',
          inputs: { message: '=$iteration.item' },
          outputs: { message: '=$result.message' },
        },
      },
      flow: [
        {
          parallel: {
            strategy: 'wait_any',
            steps: [{ do: 'first_task' }, { do: 'second_task' }],
          },
        },
        {
          conditional: {
            when: [
              {
                condition: '=$exists($output.first_task)',
                steps: [{ do: 'branch_task' }],
              },
              { else: true, steps: [{ do: 'second_task' }] },
            ],
          },
        },
        {
          loop: {
            name: 'collector',
            for_each: { item: 'entry', in: '=$input.items' },
            until: '=$iteration.index >= 1',
            accumulate: {
              as: 'sum',
              initial: 0,
              merge: '=$accumulator + $iteration.index',
            },
            steps: [{ do: 'loop_task' }],
          },
        },
      ],
      outputs: {
        summary: '=$output',
        total: '=$output.collector.sum',
      },
      inputs: {
        schema: {
          items: { type: 'array', items: { type: 'number' } },
        },
      },
    };

    const emitter = new WorkflowEventEmitter();
    const eventLog: string[] = [];
    emitter.on('hook:step:start', ({ step }) =>
      eventLog.push(`start:${step.name}`),
    );
    emitter.on('hook:step:success', ({ step }) =>
      eventLog.push(`success:${step.name}`),
    );

    const compiled = compileWorkflow(definition, {
      first_action: firstAction,
      second_action: secondAction,
      echo_action: echoAction,
    });

    const runner = new WorkflowRunner(compiled, { runId: 'run-1' });
    const context = new TestContext(undefined, emitter);
    const result = await runner.start({
      inputData: { items: [10, 20] },
      context,
    });

    expect(result.status).toBe('finished');
    if (result.status === 'finished') {
      const summary = result.output.summary as Record<string, any>;
      expect(result.output.total).toBe(1);
      expect(summary.first_task.value).toBe('alpha');
      expect(summary.collector.sum).toBe(1);
      expect(summary.loop_task.message).toBe('20');
    }

    expect(firstExecute).toHaveBeenCalledTimes(1);
    expect(secondExecute).not.toHaveBeenCalled();
    expect(echoExecute).toHaveBeenCalledTimes(3);
    expect(
      eventLog.filter((entry) => entry.includes('second_task')),
    ).toHaveLength(0);
    expect(runner.getSnapshot().status).toBe('finished');
  });

  it('handles suspension and resumes with provided data', async () => {
    const suspendAction = defineAction<
      { prompt: string },
      { reply: string },
      TestContext,
      Settings
    >({
      name: 'suspend_action',
      inputSchema: z.object({ prompt: z.string() }),
      outputSchema: z.object({ reply: z.string() }),
      execute: async ({ context }) => {
        await context.workflow.suspend({
          reason: 'awaiting_user',
          data: { channel: 'sms' },
        });
        return { reply: 'ignored' };
      },
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'suspension_flow', version: '1.0.0' },
      tasks: {
        wait_step: {
          action: 'suspend_action',
          inputs: { prompt: '="Ping"' },
          outputs: { reply: '=$result.reply' },
        },
      },
      flow: [{ do: 'wait_step' }],
      outputs: { reply: '=$output.wait_step.reply' },
    };

    const compiled = compileWorkflow(definition, {
      suspend_action: suspendAction,
    });
    const runner = new WorkflowRunner(compiled, { runId: 'run-2' });
    const context = new TestContext();

    const startResult = await runner.start({ inputData: {}, context });
    expect(startResult.status).toBe('suspended');
    if (startResult.status === 'suspended') {
      expect(startResult.reason).toBe('awaiting_user');
      expect(runner.getStatus()).toBe('suspended');
      expect(runner.getSnapshot().actions[startResult.step.id]?.status).toBe(
        'suspended',
      );
    }

    const resume = await runner.resume({ resumeData: { reply: 'Sure' } });
    expect(resume.status).toBe('finished');
    if (resume.status === 'finished') {
      expect(resume.output.reply).toBe('Sure');
      expect(runner.getLastResumeData()).toEqual({ reply: 'Sure' });
    }

    expect(() => context.workflow).toThrow();
  });

  it('accepts emitter-like implementations without Node EventEmitter', async () => {
    const pingAction = defineAction<
      unknown,
      { ok: boolean },
      TestContext,
      Settings
    >({
      name: 'ping_action',
      inputSchema: z.any(),
      outputSchema: z.object({ ok: z.boolean() }),
      execute: async () => ({ ok: true }),
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'custom_emitter', version: '1.0.0' },
      tasks: {
        ping_step: { action: 'ping_action', outputs: { ok: '=$result.ok' } },
      },
      flow: [{ do: 'ping_step' }],
      outputs: { ok: '=$output.ping_step.ok' },
    };

    const compiled = compileWorkflow(definition, { ping_action: pingAction });
    const emitter = new MemoryEmitter();
    const events: Array<{
      event: keyof WorkflowEventMap;
      payload: WorkflowEventMap[keyof WorkflowEventMap];
    }> = [];

    emitter.on('hook:workflow:start', (payload) =>
      events.push({ event: 'hook:workflow:start', payload }),
    );
    emitter.on('hook:step:start', (payload) =>
      events.push({ event: 'hook:step:start', payload }),
    );
    emitter.on('hook:step:success', (payload) =>
      events.push({ event: 'hook:step:success', payload }),
    );
    emitter.on('hook:workflow:finish', (payload) =>
      events.push({ event: 'hook:workflow:finish', payload }),
    );

    const runner = new WorkflowRunner(compiled, { runId: 'custom-run' });
    const context = new TestMemoryContext(undefined, emitter);
    const result = await runner.start({ inputData: {}, context });

    expect(result.status).toBe('finished');
    expect(events.map((entry) => entry.event)).toEqual([
      'hook:workflow:start',
      'hook:step:start',
      'hook:step:success',
      'hook:workflow:finish',
    ]);
    const finish = events.find(
      (entry) => entry.event === 'hook:workflow:finish',
    );
    expect(finish?.payload.runId).toBe('custom-run');
  });

  it('exposes the configured event emitter on the context for actions', async () => {
    let observedEmitter: WorkflowEventEmitterLike<EventEmitter> | undefined;
    const emitter = new WorkflowEventEmitter();
    const skippedEvents: Array<{ stepId: string; reason?: string }> = [];

    emitter.on('hook:step:skipped', ({ step, reason }) =>
      skippedEvents.push({ stepId: step.id, reason }),
    );

    const emitAction = defineAction<
      { note: string },
      { note: string },
      TestContext,
      Settings
    >({
      name: 'emit_action',
      inputSchema: z.object({ note: z.string() }),
      outputSchema: z.object({ note: z.string() }),
      execute: async ({ input, context }) => {
        observedEmitter = context.eventEmitter;
        context.eventEmitter?.emit('hook:step:skipped', {
          runId: 'ctx-run',
          step: { id: 'manual', name: 'emit_action', type: 'task' },
          reason: input.note,
        });
        return { note: input.note };
      },
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'context_emitter', version: '1.0.0' },
      tasks: {
        emit_step: {
          action: 'emit_action',
          inputs: { note: '=$input.note' },
          outputs: { note: '=$result.note' },
        },
      },
      flow: [{ do: 'emit_step' }],
      outputs: { note: '=$output.emit_step.note' },
      inputs: {
        schema: {
          note: { type: 'string' },
        },
      },
    };

    const compiled = compileWorkflow(definition, { emit_action: emitAction });
    const runner = new WorkflowRunner(compiled, { runId: 'ctx-run' });
    const result = await runner.start({
      inputData: { note: 'custom-event' },
      context: new TestContext(undefined, emitter),
    });

    expect(result.status).toBe('finished');
    expect(observedEmitter).toBe(emitter);
    expect(skippedEvents).toEqual([
      { stepId: 'manual', reason: 'custom-event' },
    ]);
  });

  it('bubbles action errors and prevents resume when not suspended', async () => {
    const failingAction = defineAction<unknown, unknown, TestContext, Settings>(
      {
        name: 'failing_action',
        inputSchema: z.any(),
        outputSchema: z.any(),
        execute: async () => {
          throw new Error('boom');
        },
      },
    );

    const definition: WorkflowDefinition = {
      workflow: { name: 'failure_flow', version: '1.0.0' },
      tasks: {
        fail_step: {
          action: 'failing_action',
          inputs: { value: 1 },
          outputs: { value: '=$result' },
        },
      },
      flow: [{ do: 'fail_step' }],
      outputs: { value: '=$output.fail_step.value' },
    };

    const compiled = compileWorkflow(definition, {
      failing_action: failingAction,
    });
    const runner = new WorkflowRunner(compiled);

    const result = await runner.start({
      inputData: {},
      context: new TestContext(),
    });
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect((result.error as Error).message).toBe('boom');
      expect(runner.getSnapshot().actions['0:fail_step']?.status).toBe(
        'failed',
      );
    }

    await expect(runner.resume({ resumeData: {} })).rejects.toThrow(
      'Cannot resume a workflow that is not suspended.',
    );
  });

  it('resumes a suspended step and continues executing the remaining flow', async () => {
    const suspendAction = defineAction<
      { prompt: string },
      { reply: string },
      TestContext,
      Settings
    >({
      name: 'resume_suspend_action',
      inputSchema: z.object({ prompt: z.string() }),
      outputSchema: z.object({ reply: z.string() }),
      execute: async ({ context }) => {
        await context.workflow.suspend({ reason: 'need_reply' });
        return { reply: 'ignored' };
      },
    });

    const followExecute = jest.fn(async ({ input }) => ({
      formatted: input.message.toUpperCase(),
    }));
    const followAction = defineAction<
      { message: string },
      { formatted: string },
      TestContext,
      Settings
    >({
      name: 'follow_action',
      inputSchema: z.object({ message: z.string() }),
      outputSchema: z.object({ formatted: z.string() }),
      execute: followExecute,
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'resume_flow', version: '1.0.0' },
      tasks: {
        wait_step: {
          action: 'resume_suspend_action',
          inputs: { prompt: '="Ping?"' },
          outputs: { reply: '=$result.reply' },
        },
        follow_step: {
          action: 'follow_action',
          inputs: { message: '=$output.wait_step.reply' },
          outputs: { formatted: '=$result.formatted' },
        },
      },
      flow: [{ do: 'wait_step' }, { do: 'follow_step' }],
      outputs: {
        reply: '=$output.wait_step.reply',
        formatted: '=$output.follow_step.formatted',
      },
    };

    const compiled = compileWorkflow(definition, {
      resume_suspend_action: suspendAction,
      follow_action: followAction,
    });
    const runner = new WorkflowRunner(compiled);
    const startResult = await runner.start({
      inputData: {},
      context: new TestContext(),
    });

    expect(startResult.status).toBe('suspended');
    if (startResult.status !== 'suspended') {
      throw new Error('workflow did not suspend');
    }

    expect(startResult.step.id).toBe('0:wait_step');
    expect(runner.getSnapshot().actions['0:wait_step']?.status).toBe(
      'suspended',
    );

    const resumeResult = await runner.resume({ resumeData: { reply: 'ok' } });
    expect(resumeResult.status).toBe('finished');
    if (resumeResult.status === 'finished') {
      expect(resumeResult.output.reply).toBe('ok');
      expect(resumeResult.output.formatted).toBe('OK');
      expect(followExecute).toHaveBeenCalledTimes(1);
      expect(runner.getSnapshot().actions['0:wait_step']?.status).toBe(
        'completed',
      );
      expect(runner.getSnapshot().actions['1:follow_step']?.status).toBe(
        'completed',
      );
    }
  });

  it('uses the raw task result when no outputs mapping is provided', async () => {
    const rawAction = defineAction<
      { value: string },
      string,
      TestContext,
      Settings
    >({
      name: 'raw_action',
      inputSchema: z.object({ value: z.string() }),
      outputSchema: z.string(),
      execute: async ({ input }) => `echo:${input.value}`,
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'raw_output', version: '1.0.0' },
      tasks: {
        raw_step: { action: 'raw_action', inputs: { value: '="hello"' } },
      },
      flow: [{ do: 'raw_step' }],
      outputs: { final: '=$output.raw_step' },
    };

    const compiled = compileWorkflow(definition, { raw_action: rawAction });
    const runner = new WorkflowRunner(compiled);
    const result = await runner.start({
      inputData: {},
      context: new TestContext(),
    });

    expect(result.status).toBe('finished');
    if (result.status === 'finished') {
      expect(result.output.final).toBe('echo:hello');
      const runtimeState = (runner as unknown as { state: ExecutionState })
        .state;
      expect(runtimeState?.output.raw_step).toBe('echo:hello');
      expect(runner.getSnapshot().actions['0:raw_step']?.status).toBe(
        'completed',
      );
    }
  });

  it('throws when a persisted suspension cannot be rebuilt', async () => {
    const noopAction = defineAction<
      unknown,
      { ok: boolean },
      TestContext,
      Settings
    >({
      name: 'noop_action',
      inputSchema: z.any(),
      outputSchema: z.object({ ok: z.boolean() }),
      execute: async () => ({ ok: true }),
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'unrebuildable', version: '1.0.0' },
      tasks: {
        only_step: { action: 'noop_action', inputs: {} },
      },
      flow: [{ do: 'only_step' }],
      outputs: { ok: '=$output.only_step.ok' },
    };

    const compiled = compileWorkflow(definition, { noop_action: noopAction });
    const persistedState: ExecutionState = {
      input: {},
      memory: {},
      output: {},
      iterationStack: [],
    };

    await expect(
      WorkflowRunner.fromPersistedState(compiled, {
        state: persistedState,
        context: new TestContext(),
        snapshot: { status: 'suspended', actions: {} },
        suspension: { stepId: 'unknown.step', reason: null, data: undefined },
      }),
    ).rejects.toThrow('Unable to rebuild suspension for step unknown.step');
  });

  it('rebuilds loop suspension using the iteration suffix when iterationStack is missing', async () => {
    const suspendAction = defineAction<
      { prompt: string },
      { reply: string },
      TestContext,
      Settings
    >({
      name: 'loop_suspend_action',
      inputSchema: z.object({ prompt: z.string() }),
      outputSchema: z.object({ reply: z.string() }),
      execute: async ({ input, context }) => {
        await context.workflow.suspend({
          reason: 'awaiting_reply',
          data: { prompt: input.prompt },
        });
        return { reply: 'ignored' };
      },
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'suspended_loop', version: '1.0.0' },
      tasks: {
        wait_step: {
          action: 'loop_suspend_action',
          inputs: { prompt: '="Ping"' },
          outputs: { reply: '=$result.reply' },
        },
      },
      flow: [
        {
          loop: {
            name: 'iterate',
            for_each: { item: 'entry', in: '=$input.items' },
            steps: [{ do: 'wait_step' }],
          },
        },
      ],
      outputs: { reply: '=$output.wait_step.reply' },
      inputs: {
        schema: {
          items: { type: 'array', items: { type: 'string' } },
        },
      },
    };

    const compiled = compileWorkflow(definition, {
      loop_suspend_action: suspendAction,
    });
    const runner = new WorkflowRunner(compiled);
    const context = new TestContext();

    const startResult = await runner.start({
      inputData: { items: ['first'] },
      context,
    });

    expect(startResult.status).toBe('suspended');
    if (startResult.status !== 'suspended') {
      throw new Error('Workflow did not suspend as expected');
    }

    expect(startResult.step.id).toBe('0.iterate.0:wait_step[0]');

    const runtimeState = (runner as unknown as { state: ExecutionState }).state;
    const persistedState: ExecutionState = {
      input: { ...runtimeState.input },
      memory: { ...runtimeState.memory },
      output: { ...runtimeState.output },
      iteration: runtimeState.iteration,
      accumulator: runtimeState.accumulator,
      iterationStack: [],
    };

    const rebuilt = await WorkflowRunner.fromPersistedState(compiled, {
      state: persistedState,
      context: new TestContext(),
      snapshot: startResult.snapshot,
      suspension: {
        stepId: startResult.step.id,
        reason: startResult.reason ?? null,
        data: startResult.data,
      },
    });

    const resumeResult = await rebuilt.resume({
      resumeData: { reply: 'Pong' },
    });
    expect(resumeResult.status).toBe('finished');
    if (resumeResult.status === 'finished') {
      expect(resumeResult.output.reply).toBe('Pong');
    }
  });
});
