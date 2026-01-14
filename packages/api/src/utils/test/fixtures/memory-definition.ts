/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { MemoryDefinitionCreateDto } from '@/workflow/dto/memory-definition.dto';
import { MemoryDefinitionOrmEntity } from '@/workflow/entities/memory-definition.entity';
import { MemoryScope } from '@/workflow/types';

type MemoryDefinitionOrmFixture = MemoryDefinitionCreateDto & { id: string };

export const memoryDefinitionFixtureIds = {
  global: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  workflow: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  run: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
} as const;

export const memoryDefinitionOrmFixtures: MemoryDefinitionOrmFixture[] = [
  {
    id: memoryDefinitionFixtureIds.global,
    name: 'Global Profile',
    slug: 'global_profile',
    scope: MemoryScope.global,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      additionalProperties: true,
    },
    ttlSeconds: 3600,
  },
  {
    id: memoryDefinitionFixtureIds.workflow,
    name: 'Workflow Context',
    slug: 'workflow_context',
    scope: MemoryScope.workflow,
    schema: {
      type: 'object',
      properties: {
        step: { type: 'string' },
      },
      additionalProperties: true,
    },
    ttlSeconds: null,
  },
  {
    id: memoryDefinitionFixtureIds.run,
    name: 'Run State',
    slug: 'run_state',
    scope: MemoryScope.run,
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
      additionalProperties: true,
    },
    ttlSeconds: 120,
  },
];

export const memoryDefinitionFixtures: MemoryDefinitionCreateDto[] =
  memoryDefinitionOrmFixtures.map(({ id: _id, ...fixture }) => fixture);

export const installMemoryDefinitionFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(MemoryDefinitionOrmEntity);

  if (await repository.count()) {
    return await repository.find();
  }

  const entities = repository.create(memoryDefinitionOrmFixtures);

  return await repository.save(entities);
};
