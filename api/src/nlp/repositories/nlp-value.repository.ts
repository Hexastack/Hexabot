/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query, TFilterQuery } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import {
  NlpValue,
  NlpValueDocument,
  NlpValueFull,
} from '../schemas/nlp-value.schema';

@Injectable()
export class NlpValueRepository extends BaseRepository<NlpValue, 'entity'> {
  constructor(
    @InjectModel(NlpValue.name) readonly model: Model<NlpValue>,
    private readonly nlpSampleEntityRepository: NlpSampleEntityRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(model, NlpValue);
  }

  /**
   * Emits an event after a new NLP value is created, bypassing built-in values.
   *
   * @param created - The newly created NLP value document.
   */
  async postCreate(created: NlpValueDocument): Promise<void> {
    if (!created.builtin) {
      // Bypass builtin entities (probably fixtures)
      this.eventEmitter.emit('hook:nlp:value:create', created);
    }
  }

  /**
   * Emits an event after an NLP value is updated, bypassing built-in values.
   *
   * @param query - The query that was used to update the NLP value.
   * @param updated - The updated NLP value document.
   */
  async postUpdate(
    _query: Query<
      Document<NlpValue, any, any>,
      Document<NlpValue, any, any>,
      unknown,
      NlpValue,
      'findOneAndUpdate'
    >,
    updated: NlpValue,
  ): Promise<void> {
    if (!updated?.builtin) {
      // Bypass builtin entities (probably fixtures)
      this.eventEmitter.emit('hook:nlp:value:update', updated);
    }
  }

  /**
   * Handles deletion of NLP values and associated entities. If the criteria includes an ID,
   * emits an event for each deleted entity.
   *
   * @param _query - The query used to delete the NLP value(s).
   * @param criteria - The filter criteria used to identify the NLP value(s) to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpValue, any, any>,
      unknown,
      NlpValue,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpValue>,
  ): Promise<void> {
    if (criteria._id) {
      await this.nlpSampleEntityRepository.deleteMany({ value: criteria._id });

      const entities = await this.find(
        typeof criteria === 'string' ? { _id: criteria } : criteria,
      );
      entities
        .filter((e) => !e.builtin)
        .map((e) => {
          this.eventEmitter.emit('hook:nlp:value:delete', e);
        });
    } else if (criteria.entity) {
      // Do nothing : cascading deletes coming from Nlp Sample Entity
    } else {
      throw new Error('Attempted to delete a NLP value using unknown criteria');
    }
  }

  /**
   * Finds and paginates NLP values based on the provided filter and page query,
   * populating related entities.
   *
   * @param filter - The filter query used to search for NLP values.
   * @param pageQuery - The pagination query details.
   *
   * @returns A list of populated NLP values for the requested page.
   */
  async findPageAndPopulate(
    filter: TFilterQuery<NlpValue>,
    pageQuery: PageQueryDto<NlpValue>,
  ): Promise<NlpValueFull[]> {
    const query = this.findPageQuery(filter, pageQuery).populate(['entity']);
    return await this.execute(query, NlpValueFull);
  }

  /**
   * Finds and populates a single NLP value by its ID.
   *
   * @param id - The ID of the NLP value to find.
   *
   * @returns The populated NLP value document.
   */
  async findOneAndPopulate(id: string): Promise<NlpValueFull> {
    const query = this.findOneQuery(id).populate(['entity']);
    return await this.executeOne(query, NlpValueFull);
  }
}
