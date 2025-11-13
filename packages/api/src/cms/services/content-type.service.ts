/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmService } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';

import { FieldType } from '@/setting/types';

import {
  ContentType,
  ContentTypeDtoConfig,
  ContentTypeTransformerDto,
} from '../dto/contentType.dto';
import { ContentTypeOrmEntity } from '../entities/content-type.entity';
import { ContentTypeRepository } from '../repositories/content-type.repository';

const DEFAULT_FIELDS: NonNullable<ContentTypeOrmEntity['fields']> = [
  {
    name: 'title',
    label: 'Title',
    type: FieldType.text,
  },
  {
    name: 'status',
    label: 'Status',
    type: FieldType.checkbox,
  },
];

@Injectable()
export class ContentTypeService extends BaseOrmService<
  ContentTypeOrmEntity,
  ContentTypeTransformerDto,
  ContentTypeDtoConfig,
  ContentTypeRepository
> {
  constructor(readonly repository: ContentTypeRepository) {
    super(repository);
  }

  async create(payload: ContentTypeDtoConfig['create']): Promise<ContentType> {
    const fields =
      payload.fields && payload.fields.length > 0
        ? payload.fields
        : DEFAULT_FIELDS;

    return await super.create({
      ...payload,
      fields,
    });
  }
}
