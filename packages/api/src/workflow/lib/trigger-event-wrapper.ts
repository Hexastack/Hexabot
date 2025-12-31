/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowType } from '../types';

export abstract class TriggerEventWrapper {
  abstract readonly triggerType: WorkflowType;
}

export class ScheduledEventWrapper extends TriggerEventWrapper {
  readonly triggerType = WorkflowType.scheduled;

  constructor(
    private readonly payload: {
      schedule?: string | null;
      triggeredAt?: Date | string;
      input?: Record<string, unknown>;
    } = {},
  ) {
    super();
  }

  getId(): string | undefined {
    const { triggeredAt } = this.payload;
    if (!triggeredAt) {
      return undefined;
    }

    return typeof triggeredAt === 'string'
      ? triggeredAt
      : triggeredAt.toISOString();
  }

  getEventType(): WorkflowType {
    return this.triggerType;
  }

  getPayload(): Record<string, unknown> | undefined {
    return this.payload.input;
  }

  toWorkflowInput(): Record<string, unknown> {
    return { ...(this.payload.input ?? {}) };
  }

  getMetadata(): Record<string, unknown> {
    return {
      trigger: this.triggerType,
      schedule: this.payload.schedule ?? null,
      triggered_at: this.payload.triggeredAt
        ? this.getId()
        : new Date().toISOString(),
    };
  }
}

export class ManualEventWrapper extends TriggerEventWrapper {
  readonly triggerType = WorkflowType.manual;

  constructor(
    private readonly input: Record<string, unknown> = {},
    private readonly initiatedBy?: string | null,
  ) {
    super();
  }

  getEventType(): WorkflowType {
    return this.triggerType;
  }

  getPayload(): Record<string, unknown> {
    return this.input;
  }

  toWorkflowInput(): Record<string, unknown> {
    return { ...this.input };
  }

  getMetadata(): Record<string, unknown> {
    return {
      trigger: this.triggerType,
      initiated_by: this.initiatedBy ?? null,
    };
  }
}
