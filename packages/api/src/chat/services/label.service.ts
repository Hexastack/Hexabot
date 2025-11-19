/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { LabelDtoConfig, LabelTransformerDto } from '../dto/label.dto';
import { LabelOrmEntity } from '../entities/label.entity';
import { LabelRepository } from '../repositories/label.repository';

@Injectable()
export class LabelService extends BaseOrmService<
  LabelOrmEntity,
  LabelTransformerDto,
  LabelDtoConfig
> {
  constructor(readonly repository: LabelRepository) {
    super(repository);
  }
}
