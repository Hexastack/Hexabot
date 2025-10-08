/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentModule } from '@/attachment/attachment.module';

import { NlpEntityController } from './controllers/nlp-entity.controller';
import { NlpSampleController } from './controllers/nlp-sample.controller';
import { NlpValueController } from './controllers/nlp-value.controller';
import { NlpEntityRepository } from './repositories/nlp-entity.repository';
import { NlpSampleEntityRepository } from './repositories/nlp-sample-entity.repository';
import { NlpSampleRepository } from './repositories/nlp-sample.repository';
import { NlpValueRepository } from './repositories/nlp-value.repository';
import { NlpEntityModel } from './schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from './schemas/nlp-sample-entity.schema';
import { NlpSampleModel } from './schemas/nlp-sample.schema';
import { NlpValueModel } from './schemas/nlp-value.schema';
import { NlpEntitySeeder } from './seeds/nlp-entity.seed';
import { NlpValueSeeder } from './seeds/nlp-value.seed';
import { NlpEntityService } from './services/nlp-entity.service';
import { NlpSampleEntityService } from './services/nlp-sample-entity.service';
import { NlpSampleService } from './services/nlp-sample.service';
import { NlpValueService } from './services/nlp-value.service';
import { NlpService } from './services/nlp.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      NlpEntityModel,
      NlpValueModel,
      NlpSampleModel,
      NlpSampleEntityModel,
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
