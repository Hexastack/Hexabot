/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { CredentialDtoConfig } from '../dto/credential.dto';
import { CredentialOrmEntity } from '../entities/credential.entity';
import { CredentialRepository } from '../repositories/credential.repository';

@Injectable()
export class CredentialService extends BaseOrmService<
  CredentialOrmEntity,
  CredentialDtoConfig
> {
  constructor(readonly repository: CredentialRepository) {
    super(repository);
  }
}
