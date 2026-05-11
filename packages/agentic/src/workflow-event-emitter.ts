/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { StepExecutionRecord } from './context';

export enum StepType {
  Task = 'task',
  Parallel = 'parallel',
  Conditional = 'conditional',
  Loop = 'loop',
}

export type StepInfo = {
  id: string;
  name: string;
  type: StepType;
};

export type StepWorkflowEventPayload = {
  runId?: string;
  step: StepInfo;
  stepExecution?: StepExecutionRecord;
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
  'hook:step:start': StepWorkflowEventPayload;
  'hook:step:success': StepWorkflowEventPayload;
  'hook:step:error': StepWorkflowEventPayload & { error: unknown };
  'hook:step:cancelled': StepWorkflowEventPayload & { error: unknown };
  'hook:step:suspended': StepWorkflowEventPayload & {
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

type EventKey = keyof WorkflowEventMap;
type AnyListener = (payload: WorkflowEventMap[EventKey]) => void;

/**
 * Minimal, browser-friendly event emitter that preserves the typed payloads
 * exposed by {@link WorkflowEventMap}. It supports the subset of the Node.js
 * EventEmitter API that the runtime relies on (`emit` and `on`).
 */
export class WorkflowEventEmitter
  implements WorkflowEventEmitterLike<WorkflowEventEmitter>
{
  private listeners = new Map<EventKey, Set<AnyListener>>();

  emit<K extends keyof WorkflowEventMap>(
    event: K,
    payload: WorkflowEventMap[K],
  ): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return false;
    }

    eventListeners.forEach((listener) => listener(payload));

    return true;
  }

  on<K extends keyof WorkflowEventMap>(
    event: K,
    listener: (payload: WorkflowEventMap[K]) => void,
  ): this {
    const listeners = this.listeners.get(event) ?? new Set<AnyListener>();
    listeners.add(listener as AnyListener);
    this.listeners.set(event, listeners);

    return this;
  }
}
