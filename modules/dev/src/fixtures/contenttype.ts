/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FieldType } from '@hexabot/setting/types';
import { DataSource, DeepPartial } from 'typeorm';

import { ContentType, ContentTypeCreateDto } from '@hexabot/cms/dto/contentType.dto';
import { ContentTypeOrmEntity } from '@hexabot/cms/entities/content-type.entity';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

type TContentTypeFixtures = FixturesTypeBuilder<
  ContentType,
  ContentTypeCreateDto
>;

export const contentTypeDefaultValues: TContentTypeFixtures['defaultValues'] = {
  fields: [
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
  ],
};

const contentTypes: TContentTypeFixtures['values'][] = [
  {
    name: 'Product',
    fields: [
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
      {
        name: 'description',
        label: 'Description',
        type: FieldType.text,
      },
      {
        name: 'image',
        label: 'Image',
        type: FieldType.file,
      },
      {
        name: 'subtitle',
        label: 'Subtitle',
        type: FieldType.file,
      },
    ],
  },
  {
    name: 'Restaurant',
    fields: [
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
      {
        name: 'address',
        label: 'Address',
        type: FieldType.text,
      },
      {
        name: 'image',
        label: 'Image',
        type: FieldType.file,
      },
    ],
  },
  {
    name: 'Store',
    fields: [
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
      {
        name: 'address',
        label: 'Address',
        type: FieldType.text,
      },
      {
        name: 'image',
        label: 'Image',
        type: FieldType.file,
      },
    ],
  },
];

export const contentTypeFixtures = getFixturesWithDefaultValues<
  TContentTypeFixtures['values']
>({
  fixtures: contentTypes,
  defaultValues: contentTypeDefaultValues,
});

export const contentTypeOrmFixtures: DeepPartial<ContentTypeOrmEntity>[] =
  contentTypeFixtures.map(({ name, fields }) => ({
    name,
    fields,
  }));

export const installContentTypeFixturesTypeOrm = async (
  dataSource: DataSource,
): Promise<void> => {
  const repository = dataSource.getRepository(ContentTypeOrmEntity);
  const count = await repository.count();
  if (count > 0) {
    return;
  }
  const entities = repository.create(contentTypeOrmFixtures);
  await repository.save(entities);
};
