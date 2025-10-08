/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { existsSync, mkdirSync } from 'fs';

import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { AppInstance } from '@/app.instance';
import { config } from '@/config';
import { UserModule } from '@/user/user.module';

import { AttachmentController } from './controllers/attachment.controller';
import { AttachmentRepository } from './repositories/attachment.repository';
import { AttachmentModel } from './schemas/attachment.schema';
import { AttachmentService } from './services/attachment.service';

@Module({
  imports: [
    MongooseModule.forFeature([AttachmentModel]),
    PassportModule.register({
      session: true,
    }),
    UserModule,
  ],
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
