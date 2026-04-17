/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';

import type { MemoryDefinition } from '@/workflow/dto/memory-definition.dto';
import type { MemoryRecordFull } from '@/workflow/dto/memory-record.dto';
import type { WorkflowRunFull } from '@/workflow/dto/workflow-run.dto';
import { MemoryScope, WorkflowType } from '@/workflow/types';

import { TriggerEventWrapper } from '../lib/trigger-event-wrapper';
import { MemoryStore } from '../utils/memory-store';

import { WorkflowRuntimeContext } from './workflow-runtime.context';

class TestEventWrapper extends TriggerEventWrapper {
  readonly triggerType = WorkflowType.conversational;

  buildInput(): Record<string, unknown> {
    return {};
  }

  getMetadata(): Record<string, unknown> {
    return {};
  }

  getContextData(): Record<string, unknown> {
    return {
      channel: { name: 'web' },
      initiator: this.getInitiator(),
    };
  }
}

class TestWorkflowRuntimeContext extends WorkflowRuntimeContext<TestEventWrapper> {
  event: TestEventWrapper;

  eventEmitter = { emit: jest.fn() } as unknown as EventEmitter2;
}

const definition: MemoryDefinition = {
  id: 'mem-def-1',
  name: 'Profile',
  slug: 'profile',
  scope: MemoryScope.global,
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    required: ['name'],
    additionalProperties: false,
  },
  ttlSeconds: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
} as MemoryDefinition;
const record: MemoryRecordFull = {
  id: 'mem-rec-1',
  definition,
  owner: { id: 'owner-1' } as any,
  value: { name: 'Ada' },
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
} as MemoryRecordFull;
const run = {
  id: 'run-1',
  context: { locale: 'en' },
  triggeredBy: { id: 'owner-1' },
  workflow: { id: 'workflow-1' },
} as unknown as WorkflowRunFull;
const LABEL_ID_A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const LABEL_ID_B = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const LABEL_NAME_A = 'VIP_CUSTOMER';
const LABEL_NAME_B = 'RETURNING_VISITOR';

describe('WorkflowRuntimeContext', () => {
  it('keeps memory in state and syncs conversational initiator labels as names', async () => {
    const context = new TestWorkflowRuntimeContext();
    const resolveLabelNames = jest
      .fn()
      .mockResolvedValue([LABEL_NAME_A, LABEL_NAME_B]);
    (context as any).subscriber = {
      resolveLabelNames,
    };
    const store = MemoryStore.createStore(
      {
        identifiers: {
          ownerId: 'owner-1',
          workflowId: 'workflow-1',
          runId: 'run-1',
        },
        definitionCache: new Map([[definition.slug, definition]]),
        records: [record],
        upsertRecord: jest.fn(),
      },
      context,
    );
    const event = new TestEventWrapper();
    event.setInitiator({
      id: 'owner-1',
      labels: [LABEL_ID_A, LABEL_ID_B],
    } as any);

    await context.buildFromRun(run, event, store);

    expect(resolveLabelNames).toHaveBeenCalledWith([LABEL_ID_A, LABEL_ID_B]);
    expect(context.memoryStore).toBe(store);
    expect(context.state).toMatchObject({
      locale: 'en',
      channel: {
        name: 'web',
      },
      initiator: {
        id: 'owner-1',
        labels: [LABEL_NAME_A, LABEL_NAME_B],
      },
      initiatorId: 'owner-1',
      workflowId: 'workflow-1',
      runId: 'run-1',
      memory: {
        profile: { name: 'Ada' },
      },
    });
    expect((event.getInitiator() as any).labels).toEqual([
      LABEL_ID_A,
      LABEL_ID_B,
    ]);
    expect(context.state.initiator).not.toBe(event.getInitiator());
  });
});
