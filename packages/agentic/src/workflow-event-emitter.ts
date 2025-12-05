import { EventEmitter } from 'events';

export type StepType = 'task' | 'parallel' | 'conditional' | 'loop';

export type StepInfo = {
  id: string;
  name: string;
  type: StepType;
};

export type WorkflowEventMap = {
  'hook:workflow:start': { runId?: string };
  'hook:workflow:finish': { runId?: string; output: Record<string, unknown> };
  'hook:workflow:failure': { runId?: string; error: unknown };
  'hook:workflow:suspended': {
    runId?: string;
    step: StepInfo;
    reason?: string;
    data?: unknown;
  };
  'hook:step:start': { runId?: string; step: StepInfo };
  'hook:step:success': { runId?: string; step: StepInfo };
  'hook:step:error': { runId?: string; step: StepInfo; error: unknown };
  'hook:step:suspended': {
    runId?: string;
    step: StepInfo;
    reason?: string;
    data?: unknown;
  };
  'hook:step:skipped': { runId?: string; step: StepInfo; reason?: string };
};

export type EventEmitterLike = {
  emit(event: string | symbol, ...args: any[]): unknown;
  on(event: string | symbol, listener: (...args: any[]) => void): unknown;
};

export type WorkflowEventEmitterLike<E = unknown> = E & EventEmitterLike;

export class WorkflowEventEmitter
  extends EventEmitter
  implements WorkflowEventEmitterLike<EventEmitter>
{
  emit<K extends keyof WorkflowEventMap>(
    event: K,
    payload: WorkflowEventMap[K],
  ): boolean {
    return super.emit(event, payload);
  }

  on<K extends keyof WorkflowEventMap>(
    event: K,
    listener: (payload: WorkflowEventMap[K]) => void,
  ): this {
    return super.on(event, listener);
  }
}
