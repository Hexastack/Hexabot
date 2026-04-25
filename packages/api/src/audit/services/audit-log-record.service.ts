/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AuditLog } from '@hexabot-ai/types';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  And,
  Equal,
  FindManyOptions,
  FindOperator,
  FindOptionsWhere,
  In,
  Not,
} from 'typeorm';

import { config } from '@/config';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { AuditLogOrmEntity } from '../entities/audit-log.entity';
import { AuditLogRepository } from '../repositories/audit-log.repository';

const HIDDEN_AUDIT_RESOURCE_TYPES = ['AuditLog', 'Stats'];

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

  override async find(
    options: FindManyOptions<AuditLogOrmEntity> = {},
  ): Promise<AuditLog[]> {
    return await super.find(this.applyVisibilityFilter(options));
  }

  override async count(
    options: FindManyOptions<AuditLogOrmEntity> = {},
  ): Promise<number> {
    return await super.count(this.applyVisibilityFilter(options));
  }

  private applyVisibilityFilter(
    options: FindManyOptions<AuditLogOrmEntity>,
  ): FindManyOptions<AuditLogOrmEntity> {
    return {
      ...options,
      where: this.applyVisibilityWhere(options.where),
    };
  }

  private applyVisibilityWhere(
    where?: FindManyOptions<AuditLogOrmEntity>['where'],
  ): FindManyOptions<AuditLogOrmEntity>['where'] {
    if (Array.isArray(where)) {
      return where.map((clause) => this.applyVisibilityClause(clause));
    }

    return this.applyVisibilityClause(where ?? {});
  }

  private applyVisibilityClause(
    clause: FindOptionsWhere<AuditLogOrmEntity>,
  ): FindOptionsWhere<AuditLogOrmEntity> {
    return {
      ...clause,
      resourceType: this.mergeResourceTypeVisibility(clause.resourceType),
    };
  }

  private mergeResourceTypeVisibility(
    resourceType?: FindOptionsWhere<AuditLogOrmEntity>['resourceType'],
  ) {
    const visibleResourceTypes = Not(In(HIDDEN_AUDIT_RESOURCE_TYPES));

    if (resourceType === undefined) {
      return visibleResourceTypes;
    }

    const existingFilter =
      resourceType instanceof FindOperator
        ? resourceType
        : Equal(resourceType as string);

    return And(existingFilter, visibleResourceTypes);
  }
}
