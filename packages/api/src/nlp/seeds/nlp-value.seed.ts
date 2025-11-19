/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import {
  NlpValueCreateDto,
  NlpValueDtoConfig,
  NlpValueTransformerDto,
} from '../dto/nlp-value.dto';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';

@Injectable()
export class NlpValueSeeder extends BaseOrmSeeder<
  NlpValueOrmEntity,
  NlpValueTransformerDto,
  NlpValueDtoConfig
> {
  constructor(
    nlpValueRepository: NlpValueRepository,
    private readonly nlpEntityRepository: NlpEntityRepository,
  ) {
    super(nlpValueRepository);
  }

  async seed(models: NlpValueCreateDto[]): Promise<boolean> {
    if (await this.isEmpty()) {
      const entities = await this.nlpEntityRepository.findAll();
      const modelDtos = models.map((v) => ({
        ...v,
        entity: entities.find(({ name }) => name === v.entity)?.id as string,
      }));
      await this.repository.createMany(modelDtos);

      return true;
    }

    return false;
  }
}
