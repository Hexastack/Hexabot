import { z } from 'zod';

import { defineAction } from '../action/action';
import { WorkflowContext } from '../context';
import type { Settings, WorkflowDefinition } from '../dsl.types';
import { WorkflowEventEmitter } from '../workflow-event-emitter';
import { WorkflowRunner } from '../workflow-runner';
import { compileWorkflow } from '../workflow-compiler';

class TestContext extends WorkflowContext {
  constructor(initial?: Record<string, unknown>) {
    super(initial);
  }
}

const baseRetries = { max_attempts: 1, backoff_ms: 0, max_delay_ms: 0, jitter: 0, multiplier: 1 };

describe('WorkflowRunner', () => {
  it('executes parallel, conditional, and loop steps while tracking snapshots', async () => {
    const firstExecute = jest.fn(async () => ({ value: 'alpha' }));
    const secondExecute = jest.fn(async () => ({ value: 'beta' }));
    const echoExecute = jest.fn(async ({ input }) => ({
      message: String(input.message),
    }));

    const firstAction = defineAction<unknown, { value: string }, TestContext, Settings>({
      name: 'first_action',
      inputSchema: z.any(),
      outputSchema: z.object({ value: z.string() }),
      execute: firstExecute,
    });
    const secondAction = defineAction<unknown, { value: string }, TestContext, Settings>({
      name: 'second_action',
      inputSchema: z.any(),
      outputSchema: z.object({ value: z.string() }),
      execute: secondExecute,
    });
    const echoAction = defineAction<{ message?: unknown }, { message: string }, TestContext, Settings>({
      name: 'echo_action',
      inputSchema: z.object({ message: z.any() }),
      outputSchema: z.object({ message: z.string() }),
      execute: echoExecute,
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'control_flow', version: '1.0.0' },
      defaults: { settings: { timeout_ms: 0, retries: baseRetries } },
      tasks: {
        first_task: { action: 'first_action', outputs: { value: '=$result.value' } },
        second_task: { action: 'second_action', outputs: { value: '=$result.value' } },
        branch_task: {
          action: 'echo_action',
          inputs: { message: '=$exists($iteration) ? $iteration.item : "conditional"' },
          outputs: { message: '=$result.message' },
        },
        loop_task: {
          action: 'echo_action',
          inputs: { message: '=$iteration.item' },
          outputs: { message: '=$result.message' },
        },
      },
      flow: [
        { parallel: { strategy: 'wait_any', steps: [{ do: 'first_task' }, { do: 'second_task' }] } },
        {
          conditional: {
            when: [
              { condition: '=$exists($output.first_task)', steps: [{ do: 'branch_task' }] },
              { else: true, steps: [{ do: 'second_task' }] },
            ],
          },
        },
        {
          loop: {
            name: 'collector',
            for_each: { item: 'entry', in: '=$input.items' },
            until: '=$iteration.index >= 1',
            accumulate: { as: 'sum', initial: 0, merge: '=$accumulator + $iteration.index' },
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
    emitter.on('step:start', ({ step }) => eventLog.push(`start:${step.name}`));
    emitter.on('step:success', ({ step }) => eventLog.push(`success:${step.name}`));

    const compiled = compileWorkflow(definition, {
      first_action: firstAction,
      second_action: secondAction,
      echo_action: echoAction,
    });

    const runner = new WorkflowRunner(compiled, { eventEmitter: emitter, runId: 'run-1' });
    const context = new TestContext();
    const result = await runner.start({ inputData: { items: [10, 20] }, context });

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
    expect(eventLog.filter((entry) => entry.includes('second_task'))).toHaveLength(0);
    expect(runner.getSnapshot().status).toBe('finished');
  });

  it('handles suspension and resumes with provided data', async () => {
    const suspendAction = defineAction<{ prompt: string }, { reply: string }, TestContext, Settings>({
      name: 'suspend_action',
      inputSchema: z.object({ prompt: z.string() }),
      outputSchema: z.object({ reply: z.string() }),
      execute: async ({ context }) => {
        await context.workflow.suspend({ reason: 'awaiting_user', data: { channel: 'sms' } });
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

    const compiled = compileWorkflow(definition, { suspend_action: suspendAction });
    const runner = new WorkflowRunner(compiled, { runId: 'run-2' });
    const context = new TestContext();

    const startResult = await runner.start({ inputData: {}, context });
    expect(startResult.status).toBe('suspended');
    if (startResult.status === 'suspended') {
      expect(startResult.reason).toBe('awaiting_user');
      expect(runner.getStatus()).toBe('suspended');
      expect(runner.getSnapshot().actions[startResult.step.id]?.status).toBe('suspended');
    }

    const resume = await runner.resume({ resumeData: { reply: 'Sure' } });
    expect(resume.status).toBe('finished');
    if (resume.status === 'finished') {
      expect(resume.output.reply).toBe('Sure');
      expect(runner.getLastResumeData()).toEqual({ reply: 'Sure' });
    }

    expect(() => context.workflow).toThrow();
  });

  it('bubbles action errors and prevents resume when not suspended', async () => {
    const failingAction = defineAction<unknown, unknown, TestContext, Settings>({
      name: 'failing_action',
      inputSchema: z.any(),
      outputSchema: z.any(),
      execute: async () => {
        throw new Error('boom');
      },
    });

    const definition: WorkflowDefinition = {
      workflow: { name: 'failure_flow', version: '1.0.0' },
      tasks: {
        fail_step: { action: 'failing_action', inputs: { value: 1 }, outputs: { value: '=$result' } },
      },
      flow: [{ do: 'fail_step' }],
      outputs: { value: '=$output.fail_step.value' },
    };

    const compiled = compileWorkflow(definition, { failing_action: failingAction });
    const runner = new WorkflowRunner(compiled);

    const result = await runner.start({ inputData: {}, context: new TestContext() });
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect((result.error as Error).message).toBe('boom');
      expect(runner.getSnapshot().actions['0:fail_step']?.status).toBe('failed');
    }

    await expect(runner.resume({ resumeData: {} })).rejects.toThrow('Cannot resume a workflow that is not suspended.');
  });
});
