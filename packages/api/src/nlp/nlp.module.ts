/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentModule } from '@/attachment/attachment.module';

import { NlpEntityController } from './controllers/nlp-entity.controller';
import { NlpSampleController } from './controllers/nlp-sample.controller';
import { NlpValueController } from './controllers/nlp-value.controller';
import { NlpEntityOrmEntity } from './entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from './entities/nlp-sample-entity.entity';
import { NlpSampleOrmEntity } from './entities/nlp-sample.entity';
import { NlpValueOrmEntity } from './entities/nlp-value.entity';
import { NlpEntityRepository } from './repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from './repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from './repositories/nlp-sample.repository';
import { NlpValueRepository } from './repositories/nlp-value.repository';
import { NlpEntitySeeder } from './seeds/nlp-entity.seed';
import { NlpValueSeeder } from './seeds/nlp-value.seed';
import { NlpEntityService } from './services/nlp-entity.service';
import { NlpSampleEntityService } from './services/nlp-sample-entity.service';
import { NlpSampleService } from './services/nlp-sample.service';
import { NlpValueService } from './services/nlp-value.service';
import { NlpService } from './services/nlp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NlpEntityOrmEntity,
      NlpValueOrmEntity,
      NlpSampleOrmEntity,
      NlpSampleEntityOrmEntity,
    ]),
    AttachmentModule,
    HttpModule,
  ],
  controllers: [NlpEntityController, NlpValueController, NlpSampleController],
  providers: [
    NlpEntityRepository,
    NlpValueRepository,
    NlpSampleRepository,
    NlpSampleEntityRepository,
    NlpEntityService,
    NlpValueService,
    NlpSampleService,
    NlpSampleEntityService,
    NlpService,
    NlpEntitySeeder,
    NlpValueSeeder,
  ],
  exports: [NlpService, NlpSampleService, NlpEntityService, NlpValueService],
})
export class NlpModule {}
