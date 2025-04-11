/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { NlpEntityDto } from '../dto/nlp-entity.dto';
import {
  NLP_ENTITY_POPULATE,
  NlpEntity,
  NlpEntityDocument,
  NlpEntityFull,
  NlpEntityPopulate,
} from '../schemas/nlp-entity.schema';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpValueRepository } from './nlp-value.repository';

@Injectable()
export class NlpEntityRepository extends BaseRepository<
  NlpEntity,
  NlpEntityPopulate,
  NlpEntityFull,
  NlpEntityDto
> {
  constructor(
    @InjectModel(NlpEntity.name) readonly model: Model<NlpEntity>,
    private readonly nlpValueRepository: NlpValueRepository,
    private readonly nlpSampleEntityRepository: NlpSampleEntityRepository,
  ) {
    super(model, NlpEntity, NLP_ENTITY_POPULATE, NlpEntityFull);
  }

  /**
   * Post-create hook that triggers after an NLP entity is created.
   * Emits an event to notify other parts of the system about the creation.
   * Bypasses built-in entities.
   *
   * @param created - The newly created NLP entity document.
   */
  async postCreate(_created: NlpEntityDocument): Promise<void> {
    if (!_created) {
      // Bypass builtin entities (probably fixtures)
      this.eventEmitter.emit('hook:nlpEntity:create', _created);
    }
  }

  /**
   * Post-update hook that triggers after an NLP entity is updated.
   * Emits an event to notify other parts of the system about the update.
   * Bypasses built-in entities.
   *
   * @param query - The query used to find and update the entity.
   * @param updated - The updated NLP entity document.
   */
  async postUpdate(
    _query: Query<
      Document<NlpEntity, any, any>,
      Document<NlpEntity, any, any>,
      unknown,
      NlpEntity,
      'findOneAndUpdate'
    >,
    updated: NlpEntity,
  ): Promise<void> {
    if (!updated?.builtin) {
      // Bypass builtin entities (probably fixtures)
      this.eventEmitter.emit('hook:nlpEntity:update', updated);
    }
  }

  /**
   * Pre-delete hook that triggers before an NLP entity is deleted.
   * Deletes related NLP values and sample entities before the entity deletion.
   * Emits an event to notify other parts of the system about the deletion.
   * Bypasses built-in entities.
   *
   * @param query The query used to delete the entity.
   * @param criteria The filter criteria used to find the entity for deletion.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpEntity, any, any>,
      unknown,
      NlpEntity,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpEntity>,
  ): Promise<void> {
    if (criteria._id) {
      await this.nlpValueRepository.deleteMany({ entity: criteria._id });
      await this.nlpSampleEntityRepository.deleteMany({ entity: criteria._id });

      const entities = await this.find(
        typeof criteria === 'string' ? { _id: criteria } : criteria,
      );
      entities
        .filter((e) => !e.builtin)
        .map((e) => {
          this.eventEmitter.emit('hook:nlpEntity:delete', e);
        });
    } else {
      throw new Error('Attempted to delete NLP entity using unknown criteria');
    }
  }
}
