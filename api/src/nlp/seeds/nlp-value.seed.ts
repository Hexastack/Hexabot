/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';

import { BaseSchema } from '@/utils/generics/base-schema';
import { BaseSeeder } from '@/utils/generics/base-seeder';

import { NlpEntityRepository } from '../repositories/nlp-entity.repository';
import { NlpValueRepository } from '../repositories/nlp-value.repository';
import {
  NlpValue,
  NlpValueFull,
  NlpValuePopulate,
} from '../schemas/nlp-value.schema';

@Injectable()
export class NlpValueSeeder extends BaseSeeder<
  NlpValue,
  NlpValuePopulate,
  NlpValueFull
> {
  constructor(
    nlpValueRepository: NlpValueRepository,
    private readonly nlpEntityRepository: NlpEntityRepository,
  ) {
    super(nlpValueRepository);
  }

  async seed(models: Omit<NlpValue, keyof BaseSchema>[]): Promise<boolean> {
    if (await this.isEmpty()) {
      const entities = await this.nlpEntityRepository.findAll();
      const modelDtos = models.map((v) => ({
        ...v,
        entity: entities.find(({ name }) => name === v.entity)?.id,
      }));
      await this.repository.createMany(modelDtos);
      return true;
    }
    return false;
  }
}
