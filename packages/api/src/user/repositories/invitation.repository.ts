/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Invitation,
  InvitationDtoConfig,
  InvitationFull,
  InvitationTransformerDto,
} from '../dto/invitation.dto';
import { InvitationOrmEntity } from '../entities/invitation.entity';
import { RoleOrmEntity } from '../entities/role.entity';

@Injectable()
export class InvitationRepository extends BaseOrmRepository<
  InvitationOrmEntity,
  InvitationTransformerDto,
  InvitationDtoConfig
> {
  constructor(
    @InjectRepository(InvitationOrmEntity)
    repository: Repository<InvitationOrmEntity>,
  ) {
    super(repository, ['roles'], {
      PlainCls: Invitation,
      FullCls: InvitationFull,
    });
  }

  protected override async preCreate(
    entity: DeepPartial<InvitationOrmEntity> | InvitationOrmEntity,
  ): Promise<void> {
    this.normalizeRoles(entity);
  }

  protected override async preUpdate(
    _current: InvitationOrmEntity,
    changes: DeepPartial<InvitationOrmEntity>,
  ): Promise<void> {
    this.normalizeRoles(changes);
  }

  private normalizeRoles(
    entity: DeepPartial<InvitationOrmEntity> | InvitationOrmEntity,
  ): void {
    if (!entity.roles) {
      return;
    }

    const roles = entity.roles as Array<
      string | RoleOrmEntity | DeepPartial<RoleOrmEntity>
    >;
    entity.roles = roles
      .map((role) => {
        if (typeof role === 'string') {
          return { id: role } as RoleOrmEntity;
        }
        if (role && typeof role === 'object' && 'id' in role && role.id) {
          return { id: role.id } as RoleOrmEntity;
        }
        return role as RoleOrmEntity;
      })
      .filter((role): role is RoleOrmEntity => Boolean(role.id));
  }
}
