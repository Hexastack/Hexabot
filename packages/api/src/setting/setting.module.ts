/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SettingController } from './controllers/setting.controller';
import { MetadataOrmEntity } from './entities/metadata.entity';
import { SettingOrmEntity } from './entities/setting.entity';
import { MetadataRepository } from './repositories/metadata.repository';
import { SettingRepository } from './repositories/setting.repository';
import { MetadataSeeder } from './seeds/metadata.seed';
import { SettingSeeder } from './seeds/setting.seed';
import { MetadataService } from './services/metadata.service';
import { SettingService } from './services/setting.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SettingOrmEntity, MetadataOrmEntity])],
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
