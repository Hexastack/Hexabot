/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';

import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import {
  installInvitationFixtures,
  invitationsFixtures,
} from '@/utils/test/fixtures/invitation';
import { installLanguageFixtures } from '@/utils/test/fixtures/language';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationCreateDto } from '../dto/invitation.dto';
import { InvitationRepository } from '../repositories/invitation.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { InvitationModel } from '../schemas/invitation.schema';
import { PermissionModel } from '../schemas/permission.schema';
import { RoleModel } from '../schemas/role.schema';

import { InvitationService } from './invitation.service';
import { PermissionService } from './permission.service';
import { RoleService } from './role.service';

describe('InvitationService', () => {
  let invitationService: InvitationService;
  let roleRepository: RoleRepository;
  let invitationRepository: InvitationRepository;
  let jwtService: JwtService;
  let mailerService: MailerService;
  const IGNORED_FIELDS = ['iat', 'exp', 'token', ...IGNORED_TEST_FIELDS];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(async () => {
          await installLanguageFixtures();
          await installInvitationFixtures();
        }),
        MongooseModule.forFeature([
          RoleModel,
          PermissionModel,
          InvitationModel,
          LanguageModel,
        ]),
        JwtModule,
      ],
      providers: [
        PermissionService,
        RoleService,
        RoleRepository,
        PermissionRepository,
        InvitationRepository,
        InvitationService,
        LanguageRepository,
        LanguageService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        InvitationRepository,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(
              (_options: ISendMailOptions): Promise<SentMessageInfo> =>
                Promise.resolve('Mail sent successfully'),
            ),
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
      ],
    });
    [
      roleRepository,
      invitationService,
      invitationRepository,
      jwtService,
      mailerService,
    ] = await getMocks([
      RoleRepository,
      InvitationService,
      InvitationRepository,
      JwtService,
      MailerService,
    ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('sign', () => {
    it('should sign a jwt', async () => {
      const test = invitationsFixtures[0];
      const jwt = await invitationService.sign(test);
      const decodedJwt = await jwtService.decode(jwt, { json: true });
      expect(jwt).toBeDefined();
      expect(decodedJwt).toEqualPayload(test, IGNORED_FIELDS);
      expect(
        jwtService.verify(jwt, invitationService.jwtSignOptions),
      ).toBeDefined();
    });

    it('should verify a jwt', async () => {
      const jwt = jwtService.sign(
        invitationsFixtures[0],
        invitationService.jwtSignOptions,
      );
      const decodedJwtPromise = invitationService.verify(jwt);
      expect(decodedJwtPromise).resolves.toEqualPayload(
        invitationsFixtures[0],
        IGNORED_FIELDS,
      );
    });
  });

  describe('create', () => {
    it('should create a valid invitation with a hashed token', async () => {
      jest.spyOn(mailerService, 'sendMail');
      jest.spyOn(invitationService, 'sign');
      const role = await roleRepository.findOne({});
      const newInvitation: InvitationCreateDto = {
        email: 'test@testland.tst',
        roles: [role!.id.toString()],
      };

      jest.spyOn(invitationRepository, 'create');
      const result = await invitationService.create(newInvitation);
      const decodedJwt = await invitationService.verify(result.token);

      expect(invitationRepository.create).toHaveBeenCalledWith({
        ...newInvitation,
        token: result.token,
      });
      expect(mailerService.sendMail).toHaveReturned();
      expect(invitationService.sign).toHaveBeenCalledWith(newInvitation);
      expect(result).toEqualPayload(newInvitation, IGNORED_FIELDS);
      expect(decodedJwt).toEqualPayload(newInvitation, IGNORED_FIELDS);
    });
  });

  describe('updateOne', () => {
    it('should throw an error', async () => {
      jest.spyOn(invitationService, 'updateOne');
      await expect(invitationService.updateOne()).rejects.toThrow();
    });
  });
});
