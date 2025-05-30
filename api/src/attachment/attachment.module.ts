/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
