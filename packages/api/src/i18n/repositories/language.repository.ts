/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  Language,
  LanguageDto,
  LanguageTransformerDto,
} from '../dto/language.dto';
import { LanguageOrmEntity } from '../entities/language.entity';

@Injectable()
export class LanguageRepository extends BaseOrmRepository<
  LanguageOrmEntity,
  LanguageTransformerDto,
  LanguageDto
> {
  constructor(
    @InjectRepository(LanguageOrmEntity)
    repository: Repository<LanguageOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: Language,
      FullCls: Language,
    });
  }

  async unsetDefaultLanguages(): Promise<void> {
    await this.repository.update({ isDefault: true }, { isDefault: false });
  }

  protected override async preCreate(
    entity: DeepPartial<LanguageOrmEntity> | LanguageOrmEntity,
  ): Promise<void> {
    if (entity && 'isDefault' in entity && entity.isDefault) {
      await this.unsetDefaultLanguages();
    }
  }

  protected override async preDelete(
    entities: LanguageOrmEntity[],
    _filter: TFilterQuery<LanguageOrmEntity>,
  ): Promise<void> {
    if (entities.some((e) => e.isDefault)) {
      throw new BadRequestException('Should not be able to delete default');
    }
  }

  protected override async preUpdate(
    _current: LanguageOrmEntity,
    changes: DeepPartial<LanguageOrmEntity>,
  ): Promise<void> {
    if (changes.isDefault) {
      await this.unsetDefaultLanguages();
    }
  }
}
