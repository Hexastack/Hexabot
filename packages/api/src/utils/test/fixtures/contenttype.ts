/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { ContentTypeCreateDto } from '@/cms/dto/contentType.dto';
import {
  ContentType,
  ContentTypeModel,
} from '@/cms/schemas/content-type.schema';
import { FieldType } from '@/setting/schemas/types';

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

export const installContentTypeFixtures = async () => {
  const ContentType = mongoose.model(
    ContentTypeModel.name,
    ContentTypeModel.schema,
  );
  return await ContentType.insertMany(contentTypeFixtures);
};
