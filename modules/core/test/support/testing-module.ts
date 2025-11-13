/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '@hexabot/logger';
import { DataSource } from 'typeorm';

import {
  DummyOrmEntity,
  DummyRepository,
  DummyService,
} from './dummy';

class NoopLoggerService {
  log() {}
  error() {}
  warn() {}
  debug() {}
  verbose() {}
  fatal() {}
}

export type DummyTestingContext = {
  module: TestingModule;
  dataSource: DataSource;
  dummyRepository: DummyRepository;
  dummyService: DummyService;
};

export const createDummyTestingContext = async (): Promise<DummyTestingContext> => {
  const module = await Test.createTestingModule({
    imports: [EventEmitterModule.forRoot()],
    providers: [
      DummyRepository,
      DummyService,
      {
        provide: LoggerService,
        useValue: new NoopLoggerService(),
      },
      {
        provide: DataSource,
        useFactory: async () => {
          const dataSource = new DataSource({
            type: 'sqlite',
            database: ':memory:',
            dropSchema: true,
            entities: [DummyOrmEntity],
            synchronize: true,
          });

          return dataSource.initialize();
        },
      },
    ],
  }).compile();

  return {
    module,
    dataSource: module.get(DataSource),
    dummyRepository: module.get(DummyRepository),
    dummyService: module.get(DummyService),
  };
};

export const destroyDummyTestingContext = async (
  context?: DummyTestingContext,
): Promise<void> => {
  if (!context) return;
  const { module, dataSource } = context;
  await module.close();
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
};
