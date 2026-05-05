/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Label } from '@hexabot-ai/types';
import { DataSource } from 'typeorm';

import { LabelCreateDto } from '@/chat/dto/label.dto';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

export type TLabelFixtures = FixturesTypeBuilder<Label, LabelCreateDto>;

export const contentLabelDefaultValues: TLabelFixtures['defaultValues'] = {
  builtin: false,
};

export const labels: TLabelFixtures['values'][] = [
  {
    description: 'test description 1',
    name: 'TEST_TITLE_1',
    title: 'test title 1',
  },
  {
    description: 'test description 2',
    name: 'TEST_TITLE_2',
    title: 'test title 2',
  },
  {
    description: 'test description 3',
    name: 'TEST_TITLE_3',
    title: 'test title 3',
  },
];

export const labelFixtures = getFixturesWithDefaultValues<
  TLabelFixtures['values']
>({
  fixtures: labels,
  defaultValues: contentLabelDefaultValues,
});

export const installLabelFixturesTypeOrm = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(LabelOrmEntity);

  if (await repository.count()) {
    return await repository.find({ relations: ['group', 'users'] });
  }

  const entities = labelFixtures.map((fixture) => {
    const { group, ...label } = fixture;

    return repository.create({
      ...label,
      builtin: fixture.builtin ?? false,
      description:
        fixture.description === undefined ? null : fixture.description,
      group: group ? ({ id: group } as Pick<LabelGroupOrmEntity, 'id'>) : null,
    });
  });

  await repository.save(entities);

  return await repository.find({ relations: ['group', 'users'] });
};
