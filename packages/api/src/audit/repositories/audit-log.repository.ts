/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { AuditLogOrmEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository extends BaseOrmRepository<AuditLogOrmEntity> {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    repository: Repository<AuditLogOrmEntity>,
  ) {
    super(repository, []);
  }
}
