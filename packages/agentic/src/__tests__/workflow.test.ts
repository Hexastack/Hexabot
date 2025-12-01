import { z } from 'zod';

import { Workflow, WorkflowEventEmitter } from '../workflow';
import { WorkflowDefinition, Settings } from '../dsl.types';
import { defineAction } from '../action/action';
import { WorkflowContext } from '../context';

class TestContext extends WorkflowContext {
  constructor(initial?: Record<string, unknown>) {
    super(initial);
  }
}

describe('Workflow execution', () => {
  it('runs a sequential workflow with JSONata inputs and merged settings', async () => {
    const greetAction = defineAction<
      { name: string },
      { name: string; settings: Settings },
      TestContext,
      Settings
    >({
      name: 'greet_action',
      inputSchema: z.object({ name: z.string() }),
      outputSchema: z.object({
        name: z.string(),
        settings: z.custom<Settings>(),
      }).strict(),
      execute: async ({ input, settings }) => ({
        name: input.name,
        settings,
      }),
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'greeting_flow', version: '1.0.0' },
      defaults: {
        settings: {
          timeout_ms: 50,
          retries: { max_attempts: 3, backoff_ms: 10, max_delay_ms: 1000, jitter: 0, multiplier: 2 },
        },
      },
      tasks: {
        greet_user: {
          action: 'greet_action',
          inputs: {
            name: '=$trim($input.name)',
          },
          outputs: {
            trimmed: '=$result.name',
            timeout: '=$result.settings.timeout_ms',
            attempts: '=$result.settings.retries.max_attempts',
            audit: '=$result.settings.audit',
          },
          settings: {
            timeout_ms: 20,
            audit: true,
            retries: {
              max_attempts: 2,
              backoff_ms: 10,
              max_delay_ms: 1000,
              jitter: 0,
              multiplier: 2,
            },
          },
        },
      },
      flow: [{ do: 'greet_user' }],
      outputs: {
        final: "='Hello ' & $output.greet_user.trimmed",
        timeout_ms: '=$output.greet_user.timeout',
        max_attempts: '=$output.greet_user.attempts',
        audit_flag: '=$output.greet_user.audit',
      },
      inputs: {
        schema: {
          name: { type: 'string' },
        },
      },
    };

    const workflow = Workflow.fromDefinition(definition, { greet_action: greetAction });
    const result = await workflow.run({ name: '  Ada  ' }, new TestContext());

    expect(result.final).toBe('Hello Ada');
    expect(result.timeout_ms).toBe(20);
    expect(result.max_attempts).toBe(2);
    expect(result.audit_flag).toBe(true);
  });

  it('supports suspension and resume through the WorkflowRunner', async () => {
    const suspendingAction = defineAction<
      { prompt: string },
      { reply?: string },
      TestContext,
      Settings
    >({
      name: 'await_reply',
      inputSchema: z.object({ prompt: z.string() }),
      outputSchema: z.object({ reply: z.string().optional() }),
      execute: async ({ context }) => {
        await context.workflow.suspend({ reason: 'waiting_for_user', data: { channel: 'email' } });
        return { reply: 'never' };
      },
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'suspension_flow', version: '1.0.0' },
      tasks: {
        ask_user: {
          action: 'await_reply',
          inputs: { prompt: '="Ping"' },
          outputs: { reply: '=$result.reply' },
        },
      },
      flow: [{ do: 'ask_user' }],
      outputs: { reply: '=$output.ask_user.reply' },
    };

    const workflow = Workflow.fromDefinition(definition, { await_reply: suspendingAction });
    const runner = await workflow.buildAsyncRunner();

    const startResult = await runner.start({ inputData: {}, context: new TestContext() });
    expect(startResult.status).toBe('suspended');
    if (startResult.status === 'suspended') {
      expect(startResult.reason).toBe('waiting_for_user');
      expect(runner.getSnapshot().actions[startResult.step.id]?.status).toBe('suspended');
    }

    const resumeResult = await runner.resume({ resumeData: { reply: 'Sure, go ahead.' } });
    expect(resumeResult.status).toBe('finished');
    if (resumeResult.status === 'finished') {
      expect(resumeResult.output.reply).toBe('Sure, go ahead.');
      expect(runner.getStatus()).toBe('finished');
    }
  });

  it('emits lifecycle events', async () => {
    const noopAction = defineAction<{ value: number }, { doubled: number }, TestContext, Settings>({
      name: 'double_value',
      inputSchema: z.object({ value: z.number() }),
      outputSchema: z.object({ doubled: z.number() }),
      execute: async ({ input }) => ({ doubled: input.value * 2 }),
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'events_flow', version: '1.0.0' },
      tasks: {
        double_step: {
          action: 'double_value',
          inputs: { value: '=$input.value' },
          outputs: { doubled: '=$result.doubled' },
        },
      },
      flow: [{ do: 'double_step' }],
      outputs: { result: '=$output.double_step.doubled' },
      inputs: {
        schema: {
          value: { type: 'number' },
        },
      },
    };

    const events: string[] = [];
    const emitter = new WorkflowEventEmitter();
    emitter.on('workflow:start', () => events.push('workflow:start'));
    emitter.on('step:start', ({ step }: { step: { name: string } }) =>
      events.push(`step:start:${step.name}`),
    );
    emitter.on('step:success', ({ step }: { step: { name: string } }) =>
      events.push(`step:success:${step.name}`),
    );
    emitter.on('workflow:finish', () => events.push('workflow:finish'));

    const workflow = Workflow.fromDefinition(definition, { double_value: noopAction });
    const runner = await workflow.buildAsyncRunner({ eventEmitter: emitter });
    const outcome = await runner.start({ inputData: { value: 5 }, context: new TestContext() });

    expect(outcome.status).toBe('finished');
    if (outcome.status === 'finished') {
      expect(outcome.output.result).toBe(10);
    }
    expect(events).toEqual([
      'workflow:start',
      'step:start:double_step',
      'step:success:double_step',
      'workflow:finish',
    ]);
  });

  it('throws on invalid YAML input', () => {
    expect(() => Workflow.fromYaml('workflow: {}', {} as Record<string, never>)).toThrow(
      /Workflow validation failed/,
    );
  });

  it('propagates action errors thrown during run', async () => {
    const failingAction = defineAction<unknown, unknown, TestContext, Settings>({
      name: 'failing_action',
      inputSchema: z.any(),
      outputSchema: z.any(),
      execute: async () => {
        throw new Error('failed to execute');
      },
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'failure_flow', version: '1.0.0' },
      tasks: {
        failing_task: { action: 'failing_action', inputs: {}, outputs: { result: '=$result' } },
      },
      flow: [{ do: 'failing_task' }],
      outputs: { result: '=$output.failing_task.result' },
    };

    const workflow = Workflow.fromDefinition(definition, { failing_action: failingAction });
    const context = new TestContext();

    await expect(workflow.run({}, context)).rejects.toThrow('failed to execute');
    expect(() => context.workflow).toThrow('Workflow runtime is not attached to this context.');
  });

  it('throws WorkflowSuspendedError from run when a task suspends', async () => {
    const suspendingAction = defineAction<unknown, { reply?: string }, TestContext, Settings>({
      name: 'suspending_action',
      inputSchema: z.any(),
      outputSchema: z.object({ reply: z.string().optional() }),
      execute: async ({ context }) => {
        await context.workflow.suspend({ reason: 'need_input', data: { prompt: 'ok?' } });
        return { reply: 'never' };
      },
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'suspend_flow', version: '1.0.0' },
      tasks: {
        pause_step: { action: 'suspending_action', inputs: {}, outputs: { reply: '=$result.reply' } },
      },
      flow: [{ do: 'pause_step' }],
      outputs: { reply: '=$output.pause_step.reply' },
    };

    const workflow = Workflow.fromDefinition(definition, { suspending_action: suspendingAction });
    const context = new TestContext();

    await expect(workflow.run({}, context)).rejects.toMatchObject({
      stepId: '0:pause_step',
      reason: 'need_input',
    });
    expect(() => context.workflow).toThrow('Workflow runtime is not attached to this context.');
  });
});
