/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import {
  installInvitationFixturesTypeOrm,
  invitationsFixtures,
} from '@/utils/test/fixtures/invitation';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationOrmEntity } from '../entities/invitation.entity';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';

import { InvitationRepository } from './invitation.repository';
import { RoleRepository } from './role.repository';

describe('InvitationRepository (TypeORM)', () => {
  let module: TestingModule;
  let invitationRepository: InvitationRepository;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [RoleRepository, InvitationRepository],
      typeorm: {
        entities: [
          InvitationOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          UserOrmEntity,
          AttachmentOrmEntity,
        ],
        fixtures: installInvitationFixturesTypeOrm,
      },
    });

    module = testing.module;

    [invitationRepository] = await testing.getMocks([InvitationRepository]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('findOneAndPopulate', () => {
    it('should find one invitation and populate its roles', async () => {
      const baseInvitation = invitationsFixtures[0];
      const invitation = await invitationRepository.findOne({
        where: { email: baseInvitation.email },
      });
      const result = await invitationRepository.findOneAndPopulate(
        invitation!.id,
      );

      expect(result).toBeDefined();
      expect(result!.roles?.map((role) => role.id).sort()).toEqual(
        baseInvitation.roles.sort(),
      );
    });
  });

  describe('findAndPopulate', () => {
    it('should populate roles for each invitation', async () => {
      const invitations = await invitationRepository.findAll();
      const result = await invitationRepository.findAndPopulate({});

      expect(result).toHaveLength(invitations.length);

      result.forEach((invitation) => {
        const expected = invitationsFixtures.find(
          (fixture) => fixture.email === invitation.email,
        );
        if (!expected) {
          return;
        }

        expect(invitation.roles?.map((role) => role.id).sort()).toEqual(
          expected.roles.sort(),
        );
      });
    });
  });
});
