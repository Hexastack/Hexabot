/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource, DeepPartial } from 'typeorm';

import { Block, BlockCreateDto } from '@/chat/dto/block.dto';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';
import { FileType } from '@/chat/types/attachment';
import { ButtonType } from '@/chat/types/button';
import { QuickReplyType } from '@/chat/types/quick-reply';

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

const findBlocks = async (dataSource: DataSource) =>
  await dataSource.getRepository(BlockOrmEntity).find({
    relations: [
      'category',
      'trigger_labels',
      'assign_labels',
      'nextBlocks',
      'previousBlocks',
      'attachedBlock',
      'attachedToBlock',
    ],
  });

export const installBlockFixturesTypeOrm = async (dataSource: DataSource) => {
  const blockRepository = dataSource.getRepository(BlockOrmEntity);
  const categoryRepository = dataSource.getRepository(CategoryOrmEntity);

  if (await blockRepository.count()) {
    return await findBlocks(dataSource);
  }

  let defaultCategory = await categoryRepository.findOne({
    where: { label: 'default', builtin: true },
  });

  if (!defaultCategory) {
    defaultCategory = await categoryRepository.save(
      categoryRepository.create({
        label: 'default',
        builtin: true,
        zoom: 100,
        offset: [0, 0],
      }),
    );
  }

  const blockEntities = blockFixtures.map((fixture) =>
    blockRepository.create({
      ...fixture,
      category: defaultCategory ? { id: defaultCategory.id } : null,
    } as DeepPartial<BlockOrmEntity>),
  );

  const savedBlocks = await blockRepository.save(blockEntities);

  const hasNextBlocks = savedBlocks.find(
    (block) => block.name === 'hasNextBlocks',
  );
  const hasPreviousBlocks = savedBlocks.find(
    (block) => block.name === 'hasPreviousBlocks',
  );

  if (hasNextBlocks && hasPreviousBlocks) {
    await blockRepository
      .createQueryBuilder()
      .relation(BlockOrmEntity, 'nextBlocks')
      .of(hasNextBlocks.id)
      .add(hasPreviousBlocks.id);
  }

  return await findBlocks(dataSource);
};
