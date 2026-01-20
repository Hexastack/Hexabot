/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatModule } from '@/chat/chat.module';
import { WorkflowModule } from '@/workflow/workflow.module';

import { StatsController } from './controllers/stats.controller';
import { StatsOrmEntity } from './entities/stats.entity';
import { StatsRepository } from './repositories/stats.repository';
import { StatsService } from './services/stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StatsOrmEntity]),
    ChatModule,
    WorkflowModule,
  ],
  controllers: [StatsController],
  providers: [StatsService, StatsRepository],
})
export class AnalyticsModule {}
