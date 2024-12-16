/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { PermissionRepository } from '@/user/repositories/permission.repository';
import { RoleRepository } from '@/user/repositories/role.repository';
import { UserRepository } from '@/user/repositories/user.repository';
import { PermissionModel } from '@/user/schemas/permission.schema';
import { RoleModel } from '@/user/schemas/role.schema';
import { UserModel } from '@/user/schemas/user.schema';
import { PermissionService } from '@/user/services/permission.service';
import { RoleService } from '@/user/services/role.service';
import { UserService } from '@/user/services/user.service';

import { AttachmentController } from './controllers/attachment.controller';
import { AttachmentRepository } from './repositories/attachment.repository';
import { AttachmentModel } from './schemas/attachment.schema';
import { AttachmentService } from './services/attachment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      AttachmentModel,
      RoleModel,
      PermissionModel,
      UserModel,
    ]),
    PassportModule.register({
      session: true,
    }),
  ],
  providers: [
    AttachmentRepository,
    AttachmentService,
    RoleRepository,
    RoleService,
    PermissionRepository,
    PermissionService,
    UserRepository,
    UserService,
  ],
  controllers: [AttachmentController],
  exports: [AttachmentService],
})
export class AttachmentModule {}
