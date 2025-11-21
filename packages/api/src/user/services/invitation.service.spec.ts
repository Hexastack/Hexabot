/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JwtModule, JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { LanguageOrmEntity } from '@/i18n/entities/language.entity';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageService } from '@/i18n/services/language.service';
import { MailerService } from '@/mailer/mailer.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import {
  installInvitationFixturesTypeOrm,
  invitationsFixtures,
} from '@/utils/test/fixtures/invitation';
import { installLanguageFixturesTypeOrm } from '@/utils/test/fixtures/language';
import { roleFixtureIds } from '@/utils/test/fixtures/role';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import { MailerServiceProvider } from '@/utils/test/providers/mailer-service.provider';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationCreateDto } from '../dto/invitation.dto';
import { InvitationOrmEntity } from '../entities/invitation.entity';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { InvitationRepository } from '../repositories/invitation.repository';
import { RoleRepository } from '../repositories/role.repository';

import { InvitationService } from './invitation.service';

describe('InvitationService (TypeORM)', () => {
  let module: TestingModule;
  let invitationService: InvitationService;
  let roleRepository: RoleRepository;
  let invitationRepository: InvitationRepository;
  let jwtService: JwtService;
  let mailerService: MailerService;

  const IGNORED_FIELDS = ['iat', 'exp', 'token', ...IGNORED_TEST_FIELDS];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [JwtModule.register({})],
      providers: [
        InvitationService,
        RoleRepository,
        InvitationRepository,
        LanguageService,
        LanguageRepository,
        I18nServiceProvider,
        MailerServiceProvider,
      ],
      typeorm: {
        entities: [
          InvitationOrmEntity,
          RoleOrmEntity,
          UserOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          AttachmentOrmEntity,
          LanguageOrmEntity,
        ],
        fixtures: [
          installLanguageFixturesTypeOrm,
          installInvitationFixturesTypeOrm,
        ],
      },
    });

    module = testing.module;

    [
      roleRepository,
      invitationService,
      invitationRepository,
      jwtService,
      mailerService,
    ] = await testing.getMocks([
      RoleRepository,
      InvitationService,
      InvitationRepository,
      JwtService,
      MailerService,
    ]);
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

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
      const role = await roleRepository.findOne(roleFixtureIds.admin);
      const newInvitation: InvitationCreateDto = {
        email: 'test@testland.tst',
        roles: [role!.id],
      };

      jest.spyOn(invitationRepository, 'create');
      const result = await invitationService.create(newInvitation);
      const decodedJwt = await invitationService.verify(result.token);

      expect(invitationRepository.create).toHaveBeenCalledWith({
        ...newInvitation,
        token: result.token,
      });
      expect(mailerService.sendMail).toHaveBeenCalled();
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
