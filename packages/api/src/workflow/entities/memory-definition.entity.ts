/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JSONSchema7 as JsonSchema } from 'json-schema';
import { Column, Entity, Index } from 'typeorm';

import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import {
  memoryDefinitionFullSchema,
  memoryDefinitionSchema,
  MemoryDefinitionDto,
} from '../dto/memory-definition.dto';
import { MemoryScope } from '../types';

@Entity({ name: 'memory_definitions' })
@Index(['name'], { unique: true })
@Index(['slug'], { unique: true })
export class MemoryDefinitionOrmEntity extends BaseOrmEntity<MemoryDefinitionDto> {
  plainCls = memoryDefinitionSchema;

  fullCls = memoryDefinitionFullSchema;

  /** Human-friendly label for the memory definition. */
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  /** Snake_case identifier used to reference the memory in workflow YAML. */
  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  /** Scope at which this memory applies (global, workflow, or run). */
  @EnumColumn({ enum: MemoryScope })
  scope!: MemoryScope;

  /** JSON Schema describing the expected structure of stored values. */
  @JsonColumn()
  schema!: JsonSchema;

  /** Optional TTL in seconds applied to records created from this definition. */
  @Column({ name: 'ttl_seconds', type: 'int', nullable: true })
  ttlSeconds?: number | null;
}
