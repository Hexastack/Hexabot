/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { LanguageOrmEntity } from '@/i18n/entities/language.entity';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageService } from '@/i18n/services/language.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { installLanguageFixturesTypeOrm } from '@/utils/test/fixtures/language';
import { installPermissionFixturesTypeOrm } from '@/utils/test/fixtures/permission';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import { MailerServiceProvider } from '@/utils/test/providers/mailer-service.provider';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationCreateDto } from '../dto/invitation.dto';
import { Role } from '../dto/role.dto';
import {
  User,
  UserCreateDto,
  UserEditProfileDto,
  UserUpdateStateAndRolesDto,
} from '../dto/user.dto';
import { InvitationOrmEntity } from '../entities/invitation.entity';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserProfileOrmEntity } from '../entities/user-profile.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { InvitationRepository } from '../repositories/invitation.repository';
import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { PasswordResetService } from '../services/passwordReset.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';
import { ValidateAccountService } from '../services/validate-account.service';

import { InvitationService } from './../services/invitation.service';
import { ReadWriteUserController } from './user.controller';

describe('UserController (TypeORM)', () => {
  let module: TestingModule;
  let userController: ReadWriteUserController;
  let userService: UserService;
  let roleService: RoleService;
  let invitationService: InvitationService;
  let notFoundId: string;
  let role: Role | null;
  let roles: Role[];
  let user: User | null;
  let passwordResetService: PasswordResetService;
  let jwtService: JwtService;
  beforeAll(async () => {
    const attachmentServiceMock = {
      findOne: jest.fn().mockResolvedValue(null),
      download: jest.fn(),
      upload: jest.fn(),
    };
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [ReadWriteUserController],
      imports: [JwtModule.register({})],
      providers: [
        UserService,
        RoleService,
        InvitationService,
        PermissionService,
        PasswordResetService,
        ValidateAccountService,
        LanguageService,
        LanguageRepository,
        UserRepository,
        RoleRepository,
        InvitationRepository,
        PermissionRepository,
        ModelRepository,
        {
          provide: AttachmentService,
          useValue: attachmentServiceMock,
        },
        MailerServiceProvider,
        I18nServiceProvider,
      ],
      typeorm: {
        entities: [
          UserProfileOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
          InvitationOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          AttachmentOrmEntity,
          LanguageOrmEntity,
        ],
        fixtures: [
          installLanguageFixturesTypeOrm,
          installPermissionFixturesTypeOrm,
        ],
      },
    });

    module = testing.module;

    [
      userController,
      userService,
      roleService,
      invitationService,
      jwtService,
      passwordResetService,
    ] = await testing.getMocks([
      ReadWriteUserController,
      UserService,
      RoleService,
      InvitationService,
      JwtService,
      PasswordResetService,
    ]);
    role = await roleService.findOne({ where: { name: 'admin' } });
    if (!role) {
      throw new Error('Expected admin role fixture to be available');
    }
    roles = await roleService.findAll();
    user = await userService.findOne({ where: { username: 'admin' } });
  });

  const IGNORED_FIELDS = [...IGNORED_TEST_FIELDS, 'resetToken'];

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(jest.clearAllMocks);

  describe('count', () => {
    it('should count users', async () => {
      const result = await userController.filterCount();
      const total = await userService.count();
      expect(result).toEqual({ count: total });
    });
  });

  describe('findOne', () => {
    it('should find one user and populate its roles', async () => {
      jest.spyOn(userService, 'findOneAndPopulate');
      const result = await userController.findOne(user!.id, ['roles']);
      expect(userService.findOneAndPopulate).toHaveBeenCalledWith(user!.id);
      expect(result).toMatchObject({
        id: user!.id,
        email: user!.email,
        username: user!.username,
      });
      const roleIds = (result?.roles ?? []).map((role) => role.id).sort();
      expect(roleIds).toEqual((user!.roles ?? []).sort());
    });
  });

  describe('findPage', () => {
    it('should find users without populating relations when none requested', async () => {
      const options = { order: { createdAt: 'ASC' as const } };
      const findSpy = jest.spyOn(userService, 'find');
      const findAndPopulateSpy = jest.spyOn(userService, 'findAndPopulate');
      const result = await userController.findPage([], options);

      expect(findSpy).toHaveBeenCalledWith(options);
      expect(findAndPopulateSpy).not.toHaveBeenCalled();

      const usersPlain = await userService.findAll();
      expect(result).toHaveLength(usersPlain.length);

      const adminPlain = usersPlain.find(
        (candidate) => candidate.id === user!.id,
      );
      const adminResult = result.find((candidate) => candidate.id === user!.id);
      expect(adminPlain).toBeDefined();
      expect(adminResult).toMatchObject({
        id: adminPlain!.id,
        email: adminPlain!.email,
        username: adminPlain!.username,
      });
    });

    it('should find users, and for each user populate the corresponding roles when requested', async () => {
      const options = { order: { createdAt: 'ASC' as const } };
      jest.spyOn(userService, 'findAndPopulate');
      const findSpy = jest.spyOn(userService, 'find');
      const result = await userController.findPage(['roles'], options);

      expect(userService.findAndPopulate).toHaveBeenCalledWith(options);
      expect(findSpy).not.toHaveBeenCalled();

      const usersPlain = await userService.findAll();
      expect(result).toHaveLength(usersPlain.length);

      usersPlain.forEach((plain) => {
        const full = result.find((candidate) => candidate.id === plain.id);
        expect(full).toBeDefined();
        const fullRoleIds = (full?.roles ?? []).map((role) => role.id).sort();
        expect(fullRoleIds).toEqual((plain.roles ?? []).sort());
      });
    });
  });

  describe('create', () => {
    it('should return created user', async () => {
      jest.spyOn(userService, 'create');
      const userDto: UserCreateDto = {
        username: 'testUser',
        first_name: 'testUser',
        last_name: 'testUser',
        email: 'test@test.test',
        password: 'test',
        roles: [role!.id],
        avatar: null,
      };
      const result = await userController.create(userDto);
      expect(userService.create).toHaveBeenCalledWith(userDto);
      expect(result).toMatchObject({
        email: userDto.email,
        username: userDto.username,
        first_name: userDto.first_name,
        last_name: userDto.last_name,
      });
    });
  });

  describe('updateOne', () => {
    const updateDto: UserEditProfileDto = {
      first_name: 'updated firstName',
    };
    it('should return updated user', async () => {
      jest.spyOn(userService, 'updateOne');
      const result = await userController.updateOne(
        { user: { id: user!.id } } as any,
        user!.id,
        updateDto,
      );
      expect(userService.updateOne).toHaveBeenCalledWith(user!.id, updateDto);
      expect(result).toMatchObject({
        id: user!.id,
        first_name: updateDto.first_name,
      });
    });
  });

  describe('updateStateAndRoles', () => {
    it('should return updated user', async () => {
      const expectedRoles = [role!.id].sort();
      const updateDto: UserUpdateStateAndRolesDto = {
        roles: [...expectedRoles],
      };
      jest.spyOn(userService, 'updateOne');
      const result = await userController.updateStateAndRoles(
        user!.id,
        updateDto,
        {
          session: {
            passport: {
              user: { id: user!.id },
            },
          },
        } as Request,
      );
      expect(userService.updateOne).toHaveBeenCalledWith(user!.id, updateDto);
      const updatedRoleIds = ((result.roles ?? []) as Array<string | Role>)
        .map((role) => (typeof role === 'string' ? role : role.id))
        .sort();
      expect(updatedRoleIds).toEqual(expectedRoles);
    });

    it('should return updated user after adding an extra role', async () => {
      const expectedExpandedRoles = [role!.id, roles[1].id].sort();
      const updateDto: UserUpdateStateAndRolesDto = {
        roles: [...expectedExpandedRoles],
      };
      jest.spyOn(userService, 'updateOne');
      const result = await userController.updateStateAndRoles(
        user!.id,
        updateDto,
        {
          session: {
            passport: {
              user: { id: user!.id },
            },
          },
        } as Request,
      );
      expect(userService.updateOne).toHaveBeenCalledWith(user!.id, updateDto);
      const expandedRoleIds = ((result.roles ?? []) as Array<string | Role>)
        .map((role) => (typeof role === 'string' ? role : role.id))
        .sort();
      expect(expandedRoleIds).toEqual(expectedExpandedRoles);
    });

    it('should throw a ForbiddenException when an admin try to disable his state', async () => {
      const updateDto: UserUpdateStateAndRolesDto = {
        state: false,
      };
      await expect(
        userController.updateStateAndRoles(user!.id, updateDto, {
          session: {
            passport: {
              user: { id: user!.id },
            },
          },
        } as Request),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw a ForbiddenException when an admin try to remove the his admin privileges', async () => {
      const updateDto: UserUpdateStateAndRolesDto = {
        roles: [],
      };
      await expect(
        userController.updateStateAndRoles(user!.id, updateDto, {
          session: {
            passport: {
              user: { id: user!.id },
            },
          },
        } as Request),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('passwordReset', () => {
    it('should request a password reset', async () => {
      const body = {
        email: 'admin@admin.admin',
      };

      await expect(userController.requestReset(body)).resolves.toBeUndefined();
    });

    it('should reset password', async () => {
      const body = { password: 'newPassword' };
      const token = await jwtService.sign(
        { email: 'admin@admin.admin' },
        passwordResetService.jwtSignOptions,
      );
      const spy = jest.spyOn(passwordResetService, 'sign');
      spy.mockResolvedValue(token);
      await userController.requestReset({ email: 'admin@admin.admin' });

      await expect(userController.reset(body, token)).resolves.toBeUndefined();
    });
  });

  describe('deleteOne', () => {
    it('should delete user by id', async () => {
      const result = await userController.deleteOne(user!.id);
      notFoundId = user!.id;
      expect(result).toEqual({
        acknowledged: true,
        deletedCount: 1,
      });
    });

    it('should throw a NotFoundException when attempting to delete user by id', async () => {
      await expect(userController.deleteOne(notFoundId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('invite', () => {
    const keysToIgnore = ['token', ...IGNORED_FIELDS];
    it('should create a valid user with a hashed token', async () => {
      const invitation: InvitationCreateDto = {
        email: 'email@email.com',
        roles: [role!.id],
      };
      jest.spyOn(invitationService, 'create');
      const result = await userController.invite(invitation);
      expect(invitationService.create).toHaveBeenCalledWith(invitation);
      expect(result).toEqualPayload(invitation, keysToIgnore);
    });
  });
});
