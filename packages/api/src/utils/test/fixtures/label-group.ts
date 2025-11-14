/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { LabelGroup, LabelGroupCreateDto } from '@/chat/dto/label-group.dto';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

import {
  contentLabelDefaultValues,
  installLabelFixturesTypeOrm,
  TLabelFixtures,
} from './label';

type TLabelGroupFixtures = FixturesTypeBuilder<LabelGroup, LabelGroupCreateDto>;

export const labelGroupFixtures: TLabelGroupFixtures['values'][] = [
  {
    name: 'Subscription',
  },
];

export const labelGroupLabels: TLabelFixtures['values'][] = [
  {
    name: 'FREE',
    title: 'Free',
  },
  {
    name: 'STANDARD',
    title: 'Standard',
  },
  {
    name: 'PREMIUM',
    title: 'Premium',
  },
];

export const groupedLabelFixtures = getFixturesWithDefaultValues<
  TLabelFixtures['values']
>({
  fixtures: labelGroupLabels,
  defaultValues: contentLabelDefaultValues,
});

const findLabelGroups = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(LabelGroupOrmEntity);

  return await repository.find({ relations: ['labels'] });
};
const findLabels = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(LabelOrmEntity);

  return await repository.find({ relations: ['group', 'users'] });
};

export const installLabelGroupFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const labelGroupRepository = dataSource.getRepository(LabelGroupOrmEntity);
  const labelRepository = dataSource.getRepository(LabelOrmEntity);
  const baseLabels = await installLabelFixturesTypeOrm(dataSource);

  if (await labelGroupRepository.count()) {
    return {
      labelGroups: await findLabelGroups(dataSource),
      labels: await findLabels(dataSource),
      baseLabels,
    };
  }

  const groupEntities = labelGroupFixtures.map((fixture) =>
    labelGroupRepository.create(fixture),
  );
  const savedGroups = await labelGroupRepository.save(groupEntities);
  const [primaryGroup] = savedGroups;
  const groupedLabelEntities = groupedLabelFixtures.map((fixture) =>
    labelRepository.create({
      ...fixture,
      group: primaryGroup ? { id: primaryGroup.id } : null,
    }),
  );
  await labelRepository.save(groupedLabelEntities);

  return {
    labelGroups: await findLabelGroups(dataSource),
    labels: await findLabels(dataSource),
    baseLabels,
  };
};
