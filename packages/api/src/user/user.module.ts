/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { AttachmentModule } from '@/attachment/attachment.module';
import { MailerModule } from '@/mailer/mailer.module';

import { LocalAuthController } from './controllers/auth.controller';
import { ModelController } from './controllers/model.controller';
import { PermissionController } from './controllers/permission.controller';
import { RoleController } from './controllers/role.controller';
import { ReadWriteUserController } from './controllers/user.controller';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LocalStrategy } from './passport/auth-strategy/local.strategy';
import { AuthSerializer } from './passport/session.serializer';
import { InvitationRepository } from './repositories/invitation.repository';
import { ModelRepository } from './repositories/model.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { RoleRepository } from './repositories/role.repository';
import { UserRepository } from './repositories/user.repository';
import { InvitationModel } from './schemas/invitation.schema';
import { ModelModel } from './schemas/model.schema';
import { PermissionModel } from './schemas/permission.schema';
import { RoleModel } from './schemas/role.schema';
import { UserModel } from './schemas/user.schema';
import { ModelSeeder } from './seeds/model.seed';
import { PermissionSeeder } from './seeds/permission.seed';
import { RoleSeeder } from './seeds/role.seed';
import { UserSeeder } from './seeds/user.seed';
import { AuthService } from './services/auth.service';
import { InvitationService } from './services/invitation.service';
import { ModelService } from './services/model.service';
import { PasswordResetService } from './services/passwordReset.service';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { UserService } from './services/user.service';
import { ValidateAccountService } from './services/validate-account.service';

@Module({
  imports: [
    MailerModule,
    MongooseModule.forFeature([
      UserModel,
      ModelModel,
      InvitationModel,
      RoleModel,
      PermissionModel,
    ]),
    PassportModule.register({
      session: true,
    }),
    JwtModule,
    forwardRef(() => AttachmentModule),
  ],
  providers: [
    PermissionSeeder,
    PermissionService,
    ModelService,
    UserService,
    RoleService,
    ModelSeeder,
    RoleSeeder,
    UserSeeder,
    UserRepository,
    RoleRepository,
    ModelRepository,
    PermissionRepository,
    LocalStrategy,
    AuthService,
    LocalAuthGuard,
    AuthSerializer,
    InvitationRepository,
    InvitationService,
    PasswordResetService,
    ValidateAccountService,
  ],
  controllers: [
    LocalAuthController,
    ReadWriteUserController,
    RoleController,
    PermissionController,
    ModelController,
  ],
  exports: [UserService, PermissionService, ModelService],
})
export class UserModule {}
