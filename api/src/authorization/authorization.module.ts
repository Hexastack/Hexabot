/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PermissionRepository } from '@/user/repositories/permission.repository';
import { UserRepository } from '@/user/repositories/user.repository';
import { PermissionModel } from '@/user/schemas/permission.schema';
import { UserModel } from '@/user/schemas/user.schema';
import { PermissionService } from '@/user/services/permission.service';
import { UserService } from '@/user/services/user.service';

import { AuthorizationService } from './authorization.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([PermissionModel, UserModel])],
  providers: [
    PermissionService,
    PermissionRepository,
    UserService,
    UserRepository,
    AuthorizationService,
  ],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
