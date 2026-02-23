/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { CredentialDtoConfig } from '../dto/credential.dto';
import { CredentialOrmEntity } from '../entities/credential.entity';

@Injectable()
export class CredentialRepository extends BaseOrmRepository<
  CredentialOrmEntity,
  CredentialDtoConfig
> {
  constructor(
    @InjectRepository(CredentialOrmEntity)
    repository: Repository<CredentialOrmEntity>,
  ) {
    super(repository);
  }
}
