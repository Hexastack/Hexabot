/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createHash } from 'crypto';

import {
  Workflow as AgenticWorkflow,
  WorkflowDefinition,
} from '@hexabot-ai/agentic';
import { DataSource } from 'typeorm';

import { MemoryRecordCreateDto } from '@/workflow/dto/memory-record.dto';
import { MemoryRecordOrmEntity } from '@/workflow/entities/memory-record.entity';
import { WorkflowRunOrmEntity } from '@/workflow/entities/workflow-run.entity';
import { WorkflowVersionOrmEntity } from '@/workflow/entities/workflow-version.entity';
import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';
import { WorkflowType, WorkflowVersionAction } from '@/workflow/types';

import {
  installMemoryDefinitionFixturesTypeOrm,
  memoryDefinitionFixtureIds,
} from './memory-definition';
import { installUserFixturesTypeOrm, userFixtureIds } from './user';

type MemoryRecordOrmFixture = MemoryRecordCreateDto & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const memoryWorkflowFixtureId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

export const memoryRunFixtureId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

export const memoryRecordFixtureIds = {
  globalExpired: 'f1111111-1111-1111-1111-111111111111',
  globalActive: 'f2222222-2222-2222-2222-222222222222',
  workflow: 'f3333333-3333-3333-3333-333333333333',
  run: 'f4444444-4444-4444-4444-444444444444',
} as const;

const memoryWorkflowDefinition: WorkflowDefinition = {
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

export const memoryRecordOrmFixtures: MemoryRecordOrmFixture[] = [
  {
    id: memoryRecordFixtureIds.globalExpired,
    definition: memoryDefinitionFixtureIds.global,
    owner: userFixtureIds.admin,
    value: { name: 'Expired' },
    expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    createdAt: new Date('2024-06-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-02T00:00:00.000Z'),
  },
  {
    id: memoryRecordFixtureIds.globalActive,
    definition: memoryDefinitionFixtureIds.global,
    owner: userFixtureIds.admin,
    value: { name: 'Active' },
    expiresAt: new Date('2999-01-01T00:00:00.000Z'),
    createdAt: new Date('2024-05-30T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
  },
  {
    id: memoryRecordFixtureIds.workflow,
    definition: memoryDefinitionFixtureIds.workflow,
    owner: userFixtureIds.admin,
    workflow: memoryWorkflowFixtureId,
    value: { step: 'greet' },
    createdAt: new Date('2024-05-29T00:00:00.000Z'),
    updatedAt: new Date('2024-05-30T00:00:00.000Z'),
  },
  {
    id: memoryRecordFixtureIds.run,
    definition: memoryDefinitionFixtureIds.run,
    owner: userFixtureIds.admin,
    workflow: memoryWorkflowFixtureId,
    run: memoryRunFixtureId,
    value: { count: 3 },
    createdAt: new Date('2024-05-28T00:00:00.000Z'),
    updatedAt: new Date('2024-05-29T00:00:00.000Z'),
  },
];

const installMemoryWorkflowFixturesTypeOrm = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(WorkflowOrmEntity);
  const existing = await repository.findOne({
    where: { id: memoryWorkflowFixtureId },
  });

  if (existing) {
    return existing;
  }

  const [user] = await installUserFixturesTypeOrm(dataSource);
  const entity = repository.create({
    id: memoryWorkflowFixtureId,
    name: 'memory_workflow_fixture',
    description: 'Workflow used by memory record fixtures.',
    type: WorkflowType.conversational,
    schedule: null,
    createdBy: user ? { id: user.id } : undefined,
    memoryDefinitions: [
      { id: memoryDefinitionFixtureIds.workflow },
      { id: memoryDefinitionFixtureIds.run },
    ],
  });
  const workflow = await repository.save(entity);
  const definitionYml = AgenticWorkflow.stringifyDefinition(
    memoryWorkflowDefinition,
  );
  const versionRepository = dataSource.getRepository(WorkflowVersionOrmEntity);
  const version = await versionRepository.save(
    versionRepository.create({
      workflow,
      version: 1,
      definitionYml,
      checksum: createHash('sha256').update(definitionYml).digest('hex'),
      action: WorkflowVersionAction.create,
      createdBy: user ? { id: user.id } : undefined,
    }),
  );

  workflow.currentVersion = version;

  return await repository.save(workflow);
};
const installMemoryRunFixturesTypeOrm = async (
  dataSource: DataSource,
  workflow: WorkflowOrmEntity,
) => {
  const repository = dataSource.getRepository(WorkflowRunOrmEntity);
  const existing = await repository.findOne({
    where: { id: memoryRunFixtureId },
  });

  if (existing) {
    return existing;
  }

  const entity = repository.create({
    id: memoryRunFixtureId,
    workflow: { id: workflow.id },
    status: 'idle',
  });

  return await repository.save(entity);
};
const findRecordsWithRelations = async (dataSource: DataSource) =>
  await dataSource.getRepository(MemoryRecordOrmEntity).find({
    relations: ['definition', 'owner', 'workflow', 'run'],
  });

export const installMemoryRecordFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  await installMemoryDefinitionFixturesTypeOrm(dataSource);
  await installUserFixturesTypeOrm(dataSource);

  const repository = dataSource.getRepository(MemoryRecordOrmEntity);
  if (await repository.count()) {
    return await findRecordsWithRelations(dataSource);
  }

  const workflow = await installMemoryWorkflowFixturesTypeOrm(dataSource);
  await installMemoryRunFixturesTypeOrm(dataSource, workflow);

  const entities = memoryRecordOrmFixtures.map((fixture) =>
    repository.create({
      id: fixture.id,
      definition: { id: fixture.definition },
      owner: { id: fixture.owner! },
      workflow: fixture.workflow ? { id: fixture.workflow } : null,
      run: fixture.run ? { id: fixture.run } : null,
      value: fixture.value,
      ttlSeconds: fixture.ttlSeconds ?? null,
      expiresAt: fixture.expiresAt ?? null,
      createdAt: fixture.createdAt,
      updatedAt: fixture.updatedAt,
    }),
  );

  await repository.save(entities);

  return await findRecordsWithRelations(dataSource);
};
