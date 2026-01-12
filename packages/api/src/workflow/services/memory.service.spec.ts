/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import {
  installMemoryDefinitionFixturesTypeOrm,
  memoryDefinitionFixtureIds,
  memoryDefinitionOrmFixtures,
} from '@/utils/test/fixtures/memory-definition';
import {
  installMemoryRecordFixturesTypeOrm,
  memoryRecordFixtureIds,
  memoryRecordOrmFixtures,
  memoryRunFixtureId,
  memoryWorkflowFixtureId,
} from '@/utils/test/fixtures/memory-record';
import { userFixtureIds } from '@/utils/test/fixtures/user';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { MemoryScope } from '../types';

import { MemoryRecordService } from './memory-record.service';
import { MemoryService } from './memory.service';

const globalDefinition = memoryDefinitionOrmFixtures.find(
  (fixture) => fixture.id === memoryDefinitionFixtureIds.global,
)!;
const workflowDefinition = memoryDefinitionOrmFixtures.find(
  (fixture) => fixture.id === memoryDefinitionFixtureIds.workflow,
)!;
const runDefinition = memoryDefinitionOrmFixtures.find(
  (fixture) => fixture.id === memoryDefinitionFixtureIds.run,
)!;
const expiredGlobalRecord = memoryRecordOrmFixtures.find(
  (fixture) => fixture.id === memoryRecordFixtureIds.globalExpired,
)!;
const activeGlobalRecord = memoryRecordOrmFixtures.find(
  (fixture) => fixture.id === memoryRecordFixtureIds.globalActive,
)!;
const workflowRecord = memoryRecordOrmFixtures.find(
  (fixture) => fixture.id === memoryRecordFixtureIds.workflow,
)!;
const runRecord = memoryRecordOrmFixtures.find(
  (fixture) => fixture.id === memoryRecordFixtureIds.run,
)!;

describe('MemoryService (TypeORM)', () => {
  let module: TestingModule;
  let memoryService: MemoryService;
  let memoryRecordService: MemoryRecordService;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [MemoryService],
      typeorm: {
        fixtures: [
          installMemoryDefinitionFixturesTypeOrm,
          installMemoryRecordFixturesTypeOrm,
        ],
      },
    });

    module = testing.module;
    [memoryService, memoryRecordService] = await testing.getMocks([
      MemoryService,
      MemoryRecordService,
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  it('returns an empty store when ownerId is missing', async () => {
    const findSpy = jest.spyOn(memoryRecordService, 'findAndPopulate');
    const store = await memoryService.buildStore({ ownerId: undefined });

    expect(store).toEqual({
      [MemoryScope.global]: {},
      [MemoryScope.workflow]: {},
      [MemoryScope.run]: {},
    });
    expect(findSpy).not.toHaveBeenCalled();
  });

  it('returns only global memory when workflowId and runId are omitted', async () => {
    const store = await memoryService.buildStore({
      ownerId: userFixtureIds.admin,
    });

    expect(store).toEqual({
      [MemoryScope.global]: {
        [globalDefinition.slug]: activeGlobalRecord.value,
      },
      [MemoryScope.workflow]: {},
      [MemoryScope.run]: {},
    });
  });

  it('includes workflow/run memory and skips expired records', async () => {
    const store = await memoryService.buildStore({
      ownerId: userFixtureIds.admin,
      workflowId: memoryWorkflowFixtureId,
      runId: memoryRunFixtureId,
    });

    expect(store[MemoryScope.global][globalDefinition.slug]).toEqual(
      activeGlobalRecord.value,
    );
    expect(store[MemoryScope.workflow][workflowDefinition.slug]).toEqual(
      workflowRecord.value,
    );
    expect(store[MemoryScope.run][runDefinition.slug]).toEqual(runRecord.value);
    expect(store[MemoryScope.global][globalDefinition.slug]).not.toEqual(
      expiredGlobalRecord.value,
    );
  });
});
