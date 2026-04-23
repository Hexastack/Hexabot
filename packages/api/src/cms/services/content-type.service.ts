/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ContentType } from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';
import { JSONSchema7 } from 'json-schema';

import { InferCreateDto } from '@/utils';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { ContentTypeOrmEntity } from '../entities/content-type.entity';
import { ContentTypeRepository } from '../repositories/content-type.repository';

export const DEFAULT_CONTENT_TYPE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', title: 'Title' },
    status: { type: 'boolean', title: 'Status' },
  },
} satisfies JSONSchema7;

@Injectable()
export class ContentTypeService extends BaseOrmService<ContentTypeOrmEntity> {
  constructor(readonly repository: ContentTypeRepository) {
    super(repository);
  }

  async create(
    payload: InferCreateDto<ContentTypeOrmEntity>,
  ): Promise<ContentType> {
    const schema = Object.keys(payload.schema.properties || {}).length
      ? payload.schema
      : DEFAULT_CONTENT_TYPE_SCHEMA;

    return await super.create({
      ...payload,
      schema,
    });
  }
}
