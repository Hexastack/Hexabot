import { EventEmitter } from 'events';

export type StepType = 'task' | 'parallel' | 'conditional' | 'loop';

export type StepInfo = {
  id: string;
  name: string;
  type: StepType;
};

export type WorkflowEventMap = {
  'workflow:start': { runId?: string };
  'workflow:finish': { runId?: string; output: Record<string, unknown> };
  'workflow:failure': { runId?: string; error: unknown };
  'workflow:suspended': { runId?: string; step: StepInfo; reason?: string; data?: unknown };
  'step:start': { runId?: string; step: StepInfo };
  'step:success': { runId?: string; step: StepInfo };
  'step:error': { runId?: string; step: StepInfo; error: unknown };
  'step:suspended': { runId?: string; step: StepInfo; reason?: string; data?: unknown };
  'step:skipped': { runId?: string; step: StepInfo; reason?: string };
};

export class WorkflowEventEmitter extends EventEmitter {
  emitEvent<K extends keyof WorkflowEventMap>(event: K, payload: WorkflowEventMap[K]): boolean {
    return super.emit(event, payload);
  }

  on<K extends keyof WorkflowEventMap>(
    event: K,
    listener: (payload: WorkflowEventMap[K]) => void,
  ): this {
    return super.on(event, listener);
  }
}
