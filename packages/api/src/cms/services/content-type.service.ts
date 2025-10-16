/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { FieldType } from '@/setting/types';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { ContentTypeDto } from '../dto/contentType.dto';
import { ContentType } from '../entities/content-type.entity';
import { ContentTypeRepository } from '../repositories/content-type.repository';

const DEFAULT_FIELDS: NonNullable<ContentType['fields']> = [
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
  ContentType,
  ContentTypeRepository
> {
  constructor(readonly repository: ContentTypeRepository) {
    super(repository);
  }

  async create(payload: ContentTypeDto['create']): Promise<ContentType> {
    const fields =
      payload.fields && payload.fields.length > 0
        ? payload.fields
        : DEFAULT_FIELDS;

    return await super.create({
      ...payload,
      fields,
    });
  }

  /**
   * Deletes a specific content type by its ID, using cascade deletion.
   *
   * This method triggers the deletion of a single `ContentType` entity
   * from the repository. If there are any related content, they will be
   * deleted accordingly.
   *
   * @param id - The ID of the `ContentType` to be deleted.
   *
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteCascadeOne(id: string) {
    return await this.repository.deleteOne(id);
  }
}
