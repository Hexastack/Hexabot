/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ISendMailOptions } from '@nestjs-modules/mailer';
// eslint-disable-next-line import/order
import { JwtModule, JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { SentMessageInfo } from 'nodemailer';

import { I18nService } from '@/i18n/services/i18n.service';
import { MailerService } from '@/mailer/mailer.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import {
  installInvitationFixtures,
  invitationsFixtures,
} from '@/utils/test/fixtures/invitation';
import {
  installLanguageFixtures,
  installLanguageFixturesTypeOrm,
} from '@/utils/test/fixtures/language';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationCreateDto } from '../dto/invitation.dto';
import { InvitationRepository } from '../repositories/invitation.repository';
import { RoleRepository } from '../repositories/role.repository';

import { InvitationService } from './invitation.service';

describe('InvitationService', () => {
  let invitationService: InvitationService;
  let roleRepository: RoleRepository;
  let invitationRepository: InvitationRepository;
  let jwtService: JwtService;
  let mailerService: MailerService;
  const IGNORED_FIELDS = ['iat', 'exp', 'token', ...IGNORED_TEST_FIELDS];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['PermissionModel'],
      autoInjectFrom: ['providers'],
      imports: [
        rootMongooseTestModule(async () => {
          await installLanguageFixtures();
          await installInvitationFixtures();
        }),
        JwtModule,
      ],
      providers: [
        InvitationService,
        RoleRepository,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(
              (_options: ISendMailOptions): Promise<SentMessageInfo> =>
                Promise.resolve('Mail sent successfully'),
            ),
          },
        },
      ],
      typeorm: {
        fixtures: installLanguageFixturesTypeOrm,
      },
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
        jwtService.verify(
          jwt,
          invitationService.jwtSignOptions as JwtVerifyOptions,
        ),
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
