/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity } from 'typeorm';

import { EntityDto } from '@/database/decorators/dto-transforms.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { Dummy, DummyDto } from '../dto/dummy.dto';

@Entity({ name: 'dummy' })
@EntityDto<DummyDto>({ plain: Dummy, full: Dummy })
export class DummyOrmEntity extends BaseOrmEntity<DummyDto> {
  @Column()
  dummy!: string;

  @JsonColumn({ nullable: true })
  dynamicField?: Record<string, unknown>;
}
