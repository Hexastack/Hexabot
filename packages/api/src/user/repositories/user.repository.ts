/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { UserDtoConfig } from '../dto/user.dto';
import { EUserProfileType } from '../entities/user-profile.entity';
import { UserOrmEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository extends BaseOrmRepository<
  UserOrmEntity,
  UserDtoConfig
> {
  constructor(
    @InjectRepository(UserOrmEntity)
    repository: Repository<UserOrmEntity>,
  ) {
    super(repository, ['labels', 'assignedTo', 'roles', 'avatar']);
  }

  async findOneByEmailWithPassword(
    email: string,
  ): Promise<UserOrmEntity | null> {
    return await this.repository.findOne({
      where: { email },
    });
  }

  /**
   * Returns active user IDs from a given set of user IDs.
   */
  async findActiveUserIds(userIds: string[]): Promise<string[]> {
    if (!userIds.length) {
      return [];
    }

    const activeUsers = await this.find({
      where: {
        id: In(userIds),
        state: true,
        type: EUserProfileType.UserOrmEntity,
      },
    });

    return activeUsers.map(({ id }) => id);
  }

  /**
   * Checks whether a user exists and is active.
   */
  async isActiveUser(userId: string): Promise<boolean> {
    const [activeUserId] = await this.findActiveUserIds([userId]);

    return activeUserId === userId;
  }
}
