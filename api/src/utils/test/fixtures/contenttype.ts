/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import {
  ContentType,
  ContentTypeModel,
} from '@/cms/schemas/content-type.schema';
import { BaseSchema } from '@/utils/generics/base-schema';

import { getFixturesWithDefaultValues } from '../defaultValues';

export const fieldsWithDefaultValues = {
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'checkbox',
    },
  ],
} satisfies Partial<ContentType>;

type TFieldWithDefaultValues =
  | keyof typeof fieldsWithDefaultValues
  | keyof BaseSchema;
type TTransformedField<T> = Omit<T, TFieldWithDefaultValues> &
  Partial<Pick<ContentType, TFieldWithDefaultValues>>;
type TContentType = TTransformedField<ContentType>;

const contentTypes: TContentType[] = [
  {
    name: 'Product',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'checkbox',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
      },
      {
        name: 'image',
        label: 'Image',
        type: 'file',
      },
      {
        name: 'subtitle',
        label: 'Image',
        type: 'file',
      },
    ],
  },
  {
    name: 'Restaurant',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'checkbox',
      },
      {
        name: 'address',
        label: 'Address',
        type: 'text',
      },
      {
        name: 'image',
        label: 'Image',
        type: 'file',
      },
    ],
  },
  {
    name: 'Store',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'checkbox',
      },
      {
        name: 'address',
        label: 'Address',
        type: 'text',
      },
      {
        name: 'image',
        label: 'Image',
        type: 'file',
      },
    ],
  },
];

export const contentTypeFixtures = getFixturesWithDefaultValues<TContentType>({
  fixtures: contentTypes,
  defaultValues: fieldsWithDefaultValues,
});

export const installContentTypeFixtures = async () => {
  const ContentType = mongoose.model(
    ContentTypeModel.name,
    ContentTypeModel.schema,
  );
  return await ContentType.insertMany(contentTypeFixtures);
};
