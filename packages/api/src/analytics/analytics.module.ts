/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BotStatsController } from './controllers/bot-stats.controller';
import { BotStats } from './entities/bot-stats.entity';
import { BotStatsRepository } from './repositories/bot-stats.repository';
import { BotStatsService } from './services/bot-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([BotStats])],
  controllers: [BotStatsController],
  providers: [BotStatsService, BotStatsRepository],
})
export class AnalyticsModule {}
