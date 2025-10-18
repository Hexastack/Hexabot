/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  User,
  UserDtoConfig,
  UserFull,
  UserTransformerDto,
} from '../dto/user.dto';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { hash } from '../utilities/bcryptjs';

@Injectable()
export class UserRepository extends BaseOrmRepository<
  UserOrmEntity,
  UserTransformerDto,
  UserDtoConfig
> {
  constructor(
    @InjectRepository(UserOrmEntity)
    repository: Repository<UserOrmEntity>,
  ) {
    super(repository, ['roles', 'avatarAttachment'], {
      PlainCls: User,
      FullCls: UserFull,
    });
  }

  protected override async preCreate(
    entity: DeepPartial<UserOrmEntity> | UserOrmEntity,
  ): Promise<void> {
    this.ensurePassword(entity);
    this.ensureResetToken(entity);
    this.normalizeRoles(entity);
  }

  protected override async preUpdate(
    _current: UserOrmEntity,
    changes: DeepPartial<UserOrmEntity>,
  ): Promise<void> {
    if ('password' in changes && typeof changes.password === 'string') {
      changes.password = hash(changes.password);
    }

    if ('resetToken' in changes && changes.resetToken) {
      changes.resetToken = hash(changes.resetToken);
    }

    this.normalizeRoles(changes);
  }

  private ensurePassword(
    entity: DeepPartial<UserOrmEntity> | UserOrmEntity,
  ): void {
    if (!entity.password) {
      throw new Error('No password provided');
    }

    if (typeof entity.password === 'string') {
      entity.password = hash(entity.password);
    }
  }

  private ensureResetToken(
    entity: DeepPartial<UserOrmEntity> | UserOrmEntity,
  ): void {
    if (!entity.resetToken) {
      return;
    }

    if (typeof entity.resetToken === 'string') {
      entity.resetToken = hash(entity.resetToken);
    }
  }

  private normalizeRoles(
    entity: DeepPartial<UserOrmEntity> | UserOrmEntity,
  ): void {
    if (!('roles' in entity) || !entity.roles) {
      return;
    }

    const roles = entity.roles as Array<
      string | RoleOrmEntity | DeepPartial<RoleOrmEntity>
    >;
    entity.roles = roles.map((role) => {
      if (typeof role === 'string') {
        return { id: role } as RoleOrmEntity;
      }

      if ('id' in role && role.id) {
        return { id: role.id } as RoleOrmEntity;
      }

      return role as RoleOrmEntity;
    });
  }

  async findOneByEmailWithPassword(
    email: string,
  ): Promise<UserOrmEntity | null> {
    return await this.repository.findOne({
      where: { email } as FindOptionsWhere<UserOrmEntity>,
    });
  }
}
