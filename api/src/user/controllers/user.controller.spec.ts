/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

// eslint-disable-next-line import/order
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SentMessageInfo } from 'nodemailer';

import { I18nService } from '@/i18n/services/i18n.service';
import { MailerService } from '@/mailer/mailer.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { installLanguageFixtures } from '@/utils/test/fixtures/language';
import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import { getUserFixtures, userFixtures } from '@/utils/test/fixtures/user';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationCreateDto } from '../dto/invitation.dto';
import {
  UserCreateDto,
  UserEditProfileDto,
  UserUpdateStateAndRolesDto,
} from '../dto/user.dto';
import { Role } from '../schemas/role.schema';
import { User, UserFull } from '../schemas/user.schema';
import { PasswordResetService } from '../services/passwordReset.service';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

import { InvitationService } from './../services/invitation.service';
import { ReadWriteUserController } from './user.controller';

describe('UserController', () => {
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
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [ReadWriteUserController],
      imports: [
        rootMongooseTestModule(async () => {
          await installLanguageFixtures();
          await installPermissionFixtures();
        }),
      ],
      providers: [
        {
          provide: MailerService,
          useValue: {
            sendMail(_options: ISendMailOptions): Promise<SentMessageInfo> {
              return Promise.resolve('Mail sent successfully');
            },
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [
      userController,
      userService,
      roleService,
      invitationService,
      jwtService,
      passwordResetService,
    ] = await getMocks([
      ReadWriteUserController,
      UserService,
      RoleService,
      InvitationService,
      JwtService,
      PasswordResetService,
    ]);
    role = await roleService.findOne({ name: 'admin' });
    roles = await roleService.findAll();
    user = await userService.findOne({ username: 'admin' });
  });

  const IGNORED_FIELDS = [...IGNORED_TEST_FIELDS, 'resetToken'];

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('count', () => {
    it('should count users', async () => {
      const result = await userController.filterCount();
      expect(result).toEqual({ count: userFixtures.length });
    });
  });

  describe('findOne', () => {
    it('should find one user and populate its roles', async () => {
      jest.spyOn(userService, 'findOneAndPopulate');
      const result = await userController.findOne(user!.id, ['roles']);
      expect(userService.findOneAndPopulate).toHaveBeenCalledWith(user!.id);
      expect(result).toEqualPayload(
        {
          ...userFixtures.find(({ username }) => username === 'admin'),
          roles: roles.filter(({ id }) => user!.roles.includes(id)),
        },
        [...IGNORED_FIELDS, 'password', 'provider'],
      );
    });
  });

  describe('findAll', () => {
    const pageQuery = getPageQuery<User>({ sort: ['_id', 'asc'] });

    it('should find users, and for each user populate the corresponding roles', async () => {
      jest.spyOn(userService, 'findAndPopulate');
      const result = await userService.findAndPopulate({}, pageQuery);

      const usersWithRoles = userFixtures.reduce(
        (acc, currUser) => {
          acc.push({
            ...currUser,
            roles: roles.filter(({ id }) => user?.roles?.includes(id)),
            avatar: null,
          });
          return acc;
        },
        [] as Omit<UserFull, 'id' | 'createdAt' | 'updatedAt'>[],
      );

      expect(userService.findAndPopulate).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(usersWithRoles, [
        ...IGNORED_FIELDS,
        'password',
        'provider',
      ]);
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
      expect(result).toEqualPayload(getUserFixtures([userDto])[0], [
        ...IGNORED_FIELDS,
        'password',
        'provider',
      ]);
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
      expect(result).toEqualPayload(
        {
          ...userFixtures.find(({ username }) => username === 'admin'),
          ...updateDto,
          roles: user!.roles,
        },
        [...IGNORED_FIELDS, 'password', 'provider'],
      );
    });
  });

  describe('updateStateAndRoles', () => {
    it('should return updated user', async () => {
      const updateDto: UserUpdateStateAndRolesDto = {
        roles: [role!.id],
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
      expect(result).toEqualPayload(
        {
          ...userFixtures.find(({ username }) => username === 'admin'),
          ...updateDto,
        },
        [...IGNORED_FIELDS, 'first_name', 'password', 'provider'],
      );
    });

    it('should return updated user after adding an extra role', async () => {
      const updateDto: UserUpdateStateAndRolesDto = {
        roles: [role!.id, roles[1].id],
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
      expect(result).toEqualPayload(
        {
          ...userFixtures.find(({ username }) => username === 'admin'),
          ...updateDto,
        },

        [...IGNORED_FIELDS, 'first_name', 'password', 'provider'],
      );
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
        roles: ['507f1f77bcf86cd799439011'],
      };
      jest.spyOn(invitationService, 'create');
      const result = await userController.invite(invitation);
      expect(invitationService.create).toHaveBeenCalledWith(invitation);
      expect(result).toEqualPayload(invitation, keysToIgnore);
    });
  });
});
