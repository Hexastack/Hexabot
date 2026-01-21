/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinition } from '@hexabot-ai/agentic';
import { DataSource } from 'typeorm';

import { WorkflowRunCreateDto } from '@/workflow/dto/workflow-run.dto';
import { WorkflowRunOrmEntity } from '@/workflow/entities/workflow-run.entity';
import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';
import { DirectionType, WorkflowType } from '@/workflow/types';

import { installUserFixturesTypeOrm, userFixtureIds } from './user';

type WorkflowRunOrmFixture = WorkflowRunCreateDto & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  suspendedAt?: Date | null;
  finishedAt?: Date | null;
  failedAt?: Date | null;
};

export const workflowRunWorkflowFixtureId =
  '99999999-9999-9999-9999-999999999999';

export const workflowRunFixtureIds = {
  running: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  finished: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
} as const;

const workflowRunWorkflowDefinition: WorkflowDefinition = {
  tasks: {
    noop: {
      action: 'noop_task',
    },
  },
  flow: [{ do: 'noop' }],
  outputs: {
    result: '="ok"',
  },
};

export const workflowRunOrmFixtures: WorkflowRunOrmFixture[] = [
  {
    id: workflowRunFixtureIds.running,
    workflow: workflowRunWorkflowFixtureId,
    triggeredBy: userFixtureIds.admin,
    status: 'running',
    input: { source: 'fixture' },
    output: null,
    context: { step: 'start' },
    snapshot: null,
    suspendedStep: null,
    suspensionReason: null,
    suspensionData: null,
    lastResumeData: null,
    error: null,
    suspendedAt: null,
    finishedAt: null,
    failedAt: null,
    metadata: { run: 'alpha' },
  },
  {
    id: workflowRunFixtureIds.finished,
    workflow: workflowRunWorkflowFixtureId,
    triggeredBy: null,
    status: 'finished',
    input: null,
    output: { result: 'ok' },
    context: { step: 'complete' },
    snapshot: null,
    suspendedStep: null,
    suspensionReason: null,
    suspensionData: null,
    lastResumeData: null,
    error: null,
    suspendedAt: null,
    finishedAt: new Date('2024-06-02T10:00:00.000Z'),
    failedAt: null,
    metadata: null,
  },
];

const findRunsWithRelations = async (dataSource: DataSource) =>
  await dataSource.getRepository(WorkflowRunOrmEntity).find({
    relations: ['workflow', 'triggeredBy'],
  });
const ensureWorkflowFixture = async (dataSource: DataSource) => {
  const workflowRepository = dataSource.getRepository(WorkflowOrmEntity);
  const existing = await workflowRepository.findOne({
    where: { id: workflowRunWorkflowFixtureId },
  });

  if (existing) {
    return existing;
  }

  const [user] = await installUserFixturesTypeOrm(dataSource);
  const entity = workflowRepository.create({
    id: workflowRunWorkflowFixtureId,
    name: 'workflow_run_fixture',
    version: '0.1.0',
    description: 'Workflow used by workflow run fixtures.',
    type: WorkflowType.conversational,
    schedule: null,
    createdBy: user ? { id: user.id } : undefined,
    memoryDefinitions: [],
    definition: workflowRunWorkflowDefinition,
    builtin: false,
    direction: DirectionType.HORIZONTAL,
    x: 0,
    y: 0,
    zoom: 1,
  });

  return await workflowRepository.save(entity);
};

export const installWorkflowRunFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  await installUserFixturesTypeOrm(dataSource);
  await ensureWorkflowFixture(dataSource);

  const repository = dataSource.getRepository(WorkflowRunOrmEntity);

  if (await repository.count()) {
    return await findRunsWithRelations(dataSource);
  }

  const entities = workflowRunOrmFixtures.map((fixture) =>
    repository.create({
      id: fixture.id,
      workflow: { id: fixture.workflow },
      triggeredBy: fixture.triggeredBy ? { id: fixture.triggeredBy } : null,
      status: fixture.status ?? 'idle',
      input: fixture.input ?? null,
      output: fixture.output ?? null,
      context: fixture.context ?? null,
      snapshot: fixture.snapshot ?? null,
      suspendedStep: fixture.suspendedStep ?? null,
      suspensionReason: fixture.suspensionReason ?? null,
      suspensionData: fixture.suspensionData ?? null,
      lastResumeData: fixture.lastResumeData ?? null,
      error: fixture.error ?? null,
      suspendedAt: fixture.suspendedAt ?? null,
      finishedAt: fixture.finishedAt ?? null,
      failedAt: fixture.failedAt ?? null,
      metadata: fixture.metadata ?? null,
      createdAt: fixture.createdAt,
      updatedAt: fixture.updatedAt,
    }),
  );

  await repository.save(entities);

  return await findRunsWithRelations(dataSource);
};
