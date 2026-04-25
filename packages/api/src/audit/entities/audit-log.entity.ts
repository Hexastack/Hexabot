/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { auditLogFullSchema, auditLogSchema } from '@hexabot-ai/types';
import { Column, Entity, Index } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { AuditLogDto } from '../dto/audit-log.dto';

@Entity({ name: 'audit_logs' })
@Index(['resourceType', 'resourceId'])
@Index(['actorId'])
@Index(['operationType'])
@Index(['requestId'])
export class AuditLogOrmEntity extends BaseOrmEntity<AuditLogDto> {
  plainCls = auditLogSchema;

  fullCls = auditLogFullSchema;

  @Column({ name: 'resource_id', type: 'text' })
  resourceId!: string;

  @Column({ name: 'resource_type' })
  resourceType!: string;

  @Column({ name: 'resource_label', nullable: true, type: 'text' })
  resourceLabel?: string | null;

  @Column({ name: 'operation_id' })
  operationId!: string;

  @Column({ name: 'operation_type' })
  operationType!: string;

  @Column({ name: 'operation_status' })
  operationStatus!: 'UNSPECIFIED' | 'SUCCEEDED' | 'FAILED';

  @Column({ name: 'actor_id' })
  actorId!: string;

  @Column({ name: 'actor_type' })
  actorType!: string;

  @Column({ name: 'actor_label', nullable: true, type: 'text' })
  actorLabel?: string | null;

  @Column({ name: 'actor_ip', nullable: true, type: 'text' })
  actorIp?: string | null;

  @Column({ name: 'actor_agent', nullable: true, type: 'text' })
  actorAgent?: string | null;

  @Column({ name: 'request_id', nullable: true, type: 'text' })
  requestId?: string | null;

  @Column({ name: 'request_method', nullable: true, type: 'text' })
  requestMethod?: string | null;

  @Column({ name: 'request_path', nullable: true, type: 'text' })
  requestPath?: string | null;

  @JsonColumn({ name: 'data_before', nullable: true })
  dataBefore?: unknown;

  @JsonColumn({ name: 'data_after', nullable: true })
  dataAfter?: unknown;

  @JsonColumn({ name: 'data_diff', nullable: true })
  dataDiff?: unknown;

  @JsonColumn({ nullable: true })
  raw?: unknown;
}
