/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import mongoose from 'mongoose';

import { BlockCreateDto } from '@/chat/dto/block.dto';
import { Block, BlockModel } from '@/chat/schemas/block.schema';
import { CategoryModel } from '@/chat/schemas/category.schema';
import { FileType } from '@/chat/schemas/types/attachment';
import { ButtonType } from '@/chat/schemas/types/button';
import { QuickReplyType } from '@/chat/schemas/types/quick-reply';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

type TBlockFixtures = FixturesTypeBuilder<Block, BlockCreateDto>;

export const blockDefaultValues: TBlockFixtures['defaultValues'] = {
  options: {},
  nextBlocks: [],
  capture_vars: [],
  assign_labels: [],
  trigger_labels: [],
  trigger_channels: [],
  builtin: false,
  starts_conversation: false,
};

export const blocks: TBlockFixtures['values'][] = [
  {
    name: 'hasNextBlocks',
    patterns: ['Hi'],
    outcomes: [],
    category: null,
    options: {
      typing: 0,
      fallback: {
        active: false,
        max_attempts: 1,
        message: [],
      },
    },
    message: ['Hi back !'],
    position: {
      x: 0,
      y: 0,
    },
  },
  {
    name: 'hasPreviousBlocks',
    patterns: ['colors'],
    outcomes: [],
    category: null,
    options: {
      typing: 0,
      fallback: {
        active: false,
        max_attempts: 1,
        message: [],
      },
    },
    message: {
      text: 'What"s your favorite color?',
      quickReplies: [
        {
          content_type: QuickReplyType.text,
          title: 'Green',
          payload: 'Green',
        },
        {
          content_type: QuickReplyType.text,
          title: 'Yellow',
          payload: 'Yellow',
        },
        {
          content_type: QuickReplyType.text,
          title: 'Red',
          payload: 'Red',
        },
      ],
    },
    position: {
      x: 0,
      y: 1,
    },
  },
  {
    name: 'buttons',
    patterns: ['about'],
    outcomes: [],
    category: null,
    options: {
      typing: 0,
      fallback: {
        active: false,
        max_attempts: 1,
        message: [],
      },
    },
    message: {
      text: 'What would you like to know about us?',
      buttons: [
        {
          type: ButtonType.postback,
          title: 'Vision',
          payload: 'Vision',
        },
        {
          type: ButtonType.postback,
          title: 'Values',
          payload: 'Values',
        },
        {
          type: ButtonType.postback,
          title: 'Approach',
          payload: 'Approach',
        },
      ],
    },
    position: {
      x: 0,
      y: 2,
    },
  },
  {
    name: 'attachment',
    patterns: ['image'],
    outcomes: [],
    category: null,
    options: {
      typing: 0,
      fallback: {
        active: false,
        max_attempts: 1,
        message: [],
      },
    },
    message: {
      attachment: {
        type: FileType.image,
        payload: {
          id: '1',
        },
      },
      quickReplies: [],
    },
    position: {
      x: 0,
      y: 3,
    },
  },
  {
    name: 'test',
    patterns: ['yes'],
    outcomes: [],
    category: null,
    //to be verified
    options: {
      typing: 0,
      fallback: {
        active: false,
        max_attempts: 1,
        message: [],
      },
    },
    message: [':)', ':D', ';)'],
    position: {
      x: 36,
      y: 78,
    },
  },
];

export const blockFixtures = getFixturesWithDefaultValues<
  TBlockFixtures['values']
>({
  fixtures: blocks,
  defaultValues: blockDefaultValues,
});

export const installBlockFixtures = async () => {
  const Category = mongoose.model(CategoryModel.name, CategoryModel.schema);
  const defaultCategory = await Category.create({
    label: 'default',
    builtin: true,
  });
  const Block = mongoose.model(BlockModel.name, BlockModel.schema);
  const blocks = await Block.insertMany(
    blockFixtures.map((blockFixture) => ({
      ...blockFixture,
      category: defaultCategory.id,
    })),
  );
  await Block.updateOne(
    { name: 'hasNextBlocks' },
    { $set: { nextBlocks: blocks[1].id } },
  );

  return blocks;
};
