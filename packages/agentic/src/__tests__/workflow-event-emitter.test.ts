import { WorkflowEventEmitter } from '../workflow-event-emitter';

const step = { id: 'step-1', name: 'sample', type: 'task' as const };

describe('WorkflowEventEmitter', () => {
  it('invokes listeners with strongly typed payloads', () => {
    const emitter = new WorkflowEventEmitter();
    const events: string[] = [];

    emitter.on('workflow:start', ({ runId }) => events.push(`start:${runId}`));
    emitter.on('step:skipped', ({ step: skipped }) => events.push(`skipped:${skipped.id}`));
    emitter.on('workflow:finish', ({ output }) => events.push(`finish:${output.value}`));

    expect(emitter.emitEvent('workflow:start', { runId: 'run-123' })).toBe(true);
    expect(emitter.emitEvent('step:skipped', { runId: 'run-123', step, reason: 'test' })).toBe(true);
    expect(emitter.emitEvent('workflow:finish', { runId: 'run-123', output: { value: 42 } })).toBe(true);

    expect(events).toEqual(['start:run-123', 'skipped:step-1', 'finish:42']);
  });

  it('returns false when no listeners are attached', () => {
    const emitter = new WorkflowEventEmitter();
    expect(emitter.emitEvent('step:start', { runId: 'id', step })).toBe(false);
  });
});
