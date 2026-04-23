/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { dummySchema, dummyFullSchema } from '@hexabot-ai/types';
import { Column, Entity } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { DummyDto } from '../dto/dummy.dto';

@Entity({ name: 'dummy' })
export class DummyOrmEntity extends BaseOrmEntity<DummyDto> {
  plainCls = dummySchema;

  fullCls = dummyFullSchema;

  @Column()
  dummy!: string;

  @JsonColumn({ nullable: true })
  dynamicField?: Record<string, unknown>;
}
