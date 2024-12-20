/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { getRandom } from '@/utils/helpers/safeRandom';
import { installUserFixtures } from '@/utils/test/fixtures/user';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { SocketEventDispatcherService } from '@/websocket/services/socket-event-dispatcher.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { UserCreateDto } from '../dto/user.dto';
import { InvitationRepository } from '../repositories/invitation.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { InvitationModel } from '../schemas/invitation.schema';
import { PermissionModel } from '../schemas/permission.schema';
import { Role, RoleModel } from '../schemas/role.schema';
import { UserModel } from '../schemas/user.schema';
import { InvitationService } from '../services/invitation.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';
import { ValidateAccountService } from '../services/validate-account.service';

import { LocalAuthController } from './auth.controller';

describe('AuthController', () => {
  let authController: LocalAuthController;
  let userService: UserService;
  let invitationService: InvitationService;
  let roleService: RoleService;
  let jwtService: JwtService;
  let role: Role;
  let baseUser: UserCreateDto;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocalAuthController],
      imports: [
        rootMongooseTestModule(installUserFixtures),
        MongooseModule.forFeature([
          UserModel,
          RoleModel,
          PermissionModel,
          InvitationModel,
          AttachmentModel,
          LanguageModel,
        ]),
      ],
      providers: [
        LoggerService,
        UserService,
        WebsocketGateway,
        SocketEventDispatcherService,
        AttachmentService,
        AttachmentRepository,
        UserRepository,
        LoggerService,
        PermissionService,
        RoleService,
        RoleRepository,
        PermissionRepository,
        InvitationRepository,
        InvitationService,
        LanguageRepository,
        {
          provide: LanguageService,
          useValue: {
            getDefaultLanguage: jest.fn().mockResolvedValue({
              title: 'English',
              code: 'en',
              isDefault: true,
              isRTL: false,
            }),
          },
        },
        JwtService,
        {
          provide: MailerService,
          useValue: {
            sendMail(_options: ISendMailOptions): Promise<SentMessageInfo> {
              return Promise.resolve('Mail sent successfully');
            },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        EventEmitter2,
        ValidateAccountService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    }).compile();
    authController = module.get<LocalAuthController>(LocalAuthController);
    userService = module.get<UserService>(UserService);
    invitationService = module.get<InvitationService>(InvitationService);
    roleService = module.get<RoleService>(RoleService);
    jwtService = module.get<JwtService>(JwtService);
    role = await roleService.findOne({});
    baseUser = {
      email: 'test@testing.com',
      password: getRandom().toString(),
      username: 'test',
      first_name: 'test',
      last_name: 'test',
      roles: [role.id],
    };
    await invitationService.create(baseUser);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('signup', () => {
    it('should throw a BadRequestException', async () => {
      jest.spyOn(userService, 'create');
      const userCreateDto: UserCreateDto = {
        username: 'test',
        first_name: 'test',
        last_name: 'test',
        email: 'test@test.test',
        password: 'test',
        roles: ['invalid role value'],
      };

      await expect(authController.signup(userCreateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.create).toHaveBeenCalledWith(userCreateDto);
    });

    it('should call userService.create with the correct parameters and return status ok', async () => {
      jest.spyOn(userService, 'create');
      const userCreateDto: UserCreateDto = {
        username: 'test',
        first_name: 'test',
        last_name: 'test',
        email: 'test@test.test',
        password: 'test',
        roles: ['659564cb4aa383c0d0dbc688'],
      };
      const result = await authController.signup(userCreateDto);
      expect(userService.create).toHaveBeenCalledWith(userCreateDto);
      expect(result).toEqual({ success: true });
    });
  });
  describe('acceptInvite', () => {
    it('should throw a BadRequestException because token is invalid', async () => {
      jest.spyOn(authController, 'signup');
      const promise = authController.acceptInvite(baseUser, 'invalid token');
      expect(promise).rejects.toThrow(BadRequestException);
      expect(authController.signup).not.toHaveBeenCalled();
    });

    it('should throw a UnauthorizedException because token is expired', async () => {
      const token = await jwtService.sign(baseUser, {
        ...invitationService.jwtSignOptions,
        expiresIn: '0s',
      });
      jest.spyOn(authController, 'signup');
      const promise = authController.acceptInvite(baseUser, token);
      expect(promise).rejects.toThrow(UnauthorizedException);
      expect(authController.signup).not.toHaveBeenCalled();
    });

    it('should throw a BadRequestException because email does not match', async () => {
      const token = await jwtService.sign(
        { ...baseUser, email: 'test2@wrongMail.Com' },
        invitationService.jwtSignOptions,
      );
      jest.spyOn(authController, 'signup');
      const promise = authController.acceptInvite(baseUser, token);
      expect(promise).rejects.toThrow(BadRequestException);
      expect(authController.signup).not.toHaveBeenCalled();
    });

    it('should throw a BadRequestException because role does not match', async () => {
      const token = await jwtService.sign(
        { ...baseUser, role: 'invalid role' },
        invitationService.jwtSignOptions,
      );
      jest.spyOn(authController, 'signup');
      const promise = authController.acceptInvite(baseUser, token);
      expect(promise).rejects.toThrow(InternalServerErrorException);
      expect(authController.signup).not.toHaveBeenCalled();
    });
  });
});
