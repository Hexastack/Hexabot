/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { UserDtoConfig } from '../dto/user.dto';
import { UserOrmEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService extends BaseOrmService<UserOrmEntity, UserDtoConfig> {
  constructor(readonly repository: UserRepository) {
    super(repository);
  }

  /**
   * Returns active user IDs from a given set of user IDs.
   */
  async findActiveUserIds(userIds: string[]): Promise<string[]> {
    return await this.repository.findActiveUserIds(userIds);
  }
}
