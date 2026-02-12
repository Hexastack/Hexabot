/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { UserDtoConfig } from '../dto/user.dto';
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
}
