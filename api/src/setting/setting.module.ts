/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SettingController } from './controllers/setting.controller';
import { MetadataRepository } from './repositories/metadata.repository';
import { SettingRepository } from './repositories/setting.repository';
import { MetadataModel } from './schemas/metadata.schema';
import { SettingModel } from './schemas/setting.schema';
import { MetadataSeeder } from './seeds/metadata.seed';
import { SettingSeeder } from './seeds/setting.seed';
import { MetadataService } from './services/metadata.service';
import { SettingService } from './services/setting.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([SettingModel, MetadataModel])],
  providers: [
    SettingRepository,
    MetadataRepository,
    SettingSeeder,
    MetadataSeeder,
    SettingService,
    MetadataService,
  ],
  controllers: [SettingController],
  exports: [SettingService, MetadataService],
})
export class SettingModule {}
