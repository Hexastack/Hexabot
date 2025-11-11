/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { existsSync, mkdirSync } from 'fs';

import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppInstance } from '@/app.instance';
import { config } from '@/config';
import { UserModule } from '@/user/user.module';

import { AttachmentController } from './controllers/attachment.controller';
import { AttachmentOrmEntity } from './entities/attachment.entity';
import { AttachmentRepository } from './repositories/attachment.repository';
import { AttachmentService } from './services/attachment.service';

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentOrmEntity]), UserModule],
  providers: [AttachmentRepository, AttachmentService],
  controllers: [AttachmentController],
  exports: [AttachmentService],
})
export class AttachmentModule implements OnApplicationBootstrap {
  onApplicationBootstrap() {
    if (!AppInstance.isReady()) {
      return;
    }

    // Ensure the directories exists
    if (!existsSync(config.parameters.uploadDir)) {
      mkdirSync(config.parameters.uploadDir, { recursive: true });
    }
    if (!existsSync(config.parameters.avatarDir)) {
      mkdirSync(config.parameters.avatarDir, { recursive: true });
    }
  }
}
