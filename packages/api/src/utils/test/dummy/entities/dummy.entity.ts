/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { dummyFullSchema, DummyDto, dummySchema } from '../dto/dummy.dto';

@Entity({ name: 'dummy' })
export class DummyOrmEntity extends BaseOrmEntity<DummyDto> {
  plainCls = dummySchema;

  fullCls = dummyFullSchema;

  @Column()
  dummy!: string;

  @JsonColumn({ nullable: true })
  dynamicField?: Record<string, unknown>;
}
