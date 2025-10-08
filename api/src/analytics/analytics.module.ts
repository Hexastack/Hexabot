/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

import { BotStatsController } from './controllers/bot-stats.controller';
import { BotStatsRepository } from './repositories/bot-stats.repository';
import { BotStatsModel } from './schemas/bot-stats.schema';
import { BotStatsService } from './services/bot-stats.service';

@Module({
  imports: [MongooseModule.forFeature([BotStatsModel]), EventEmitter2],
  controllers: [BotStatsController],
  providers: [BotStatsService, BotStatsRepository],
})
export class AnalyticsModule {}
