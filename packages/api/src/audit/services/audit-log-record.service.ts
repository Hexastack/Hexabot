/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { config } from '@/config';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { AuditLogOrmEntity } from '../entities/audit-log.entity';
import { AuditLogRepository } from '../repositories/audit-log.repository';

@Injectable()
export class AuditLogRecordService extends BaseOrmService<AuditLogOrmEntity> {
  constructor(readonly repository: AuditLogRepository) {
    super(repository);
  }

  assertReadableBackend(): void {
    if (config.audit.backend !== 'database') {
      throw new ServiceUnavailableException(
        'Audit log records are not stored locally for the configured backend.',
      );
    }
  }
}
