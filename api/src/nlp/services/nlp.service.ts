/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { HelperService } from '@/helper/helper.service';
import { LoggerService } from '@/logger/logger.service';

import { NlpEntity, NlpEntityDocument } from '../schemas/nlp-entity.schema';
import { NlpValue, NlpValueDocument } from '../schemas/nlp-value.schema';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';

@Injectable()
export class NlpService {
  constructor(
    private readonly logger: LoggerService,
    protected readonly nlpSampleService: NlpSampleService,
    protected readonly nlpEntityService: NlpEntityService,
    protected readonly nlpValueService: NlpValueService,
    protected readonly helperService: HelperService,
  ) {}

  /**
   * Handles the event triggered when a new NLP entity is created. Synchronizes the entity with the external NLP provider.
   *
   * @param entity - The NLP entity to be created.
   * @returns The updated entity after synchronization.
   */
  @OnEvent('hook:nlpEntity:create')
  async handleEntityCreate(entity: NlpEntityDocument) {
    // Synchonize new entity with NLP
    try {
      const helper = await this.helperService.getDefaultNluHelper();
      const foreignId = await helper.addEntity(entity);
      this.logger.debug('New entity successfully synced!', foreignId);
      return await this.nlpEntityService.updateOne(entity._id, {
        foreign_id: foreignId,
      });
    } catch (err) {
      this.logger.error('Unable to sync a new entity', err);
      return entity;
    }
  }

  /**
   * Handles the event triggered when an NLP entity is updated. Synchronizes the updated entity with the external NLP provider.
   *
   * @param entity - The NLP entity to be updated.
   */
  @OnEvent('hook:nlpEntity:update')
  async handleEntityUpdate(entity: NlpEntity) {
    // Synchonize new entity with NLP provider
    try {
      const helper = await this.helperService.getDefaultNluHelper();
      await helper.updateEntity(entity);
      this.logger.debug('Updated entity successfully synced!', entity);
    } catch (err) {
      this.logger.error('Unable to sync updated entity', err);
    }
  }

  /**
   * Handles the event triggered when an NLP entity is deleted. Synchronizes the deletion with the external NLP provider.
   *
   * @param entity - The NLP entity to be deleted.
   */
  @OnEvent('hook:nlpEntity:delete')
  async handleEntityDelete(entity: NlpEntity) {
    // Synchonize new entity with NLP provider
    try {
      if (entity.foreign_id) {
        const helper = await this.helperService.getDefaultNluHelper();
        await helper.deleteEntity(entity.foreign_id);
        this.logger.debug('Deleted entity successfully synced!', entity);
      } else {
        this.logger.error(`Entity ${entity} is missing foreign_id`);
        throw new NotFoundException(`Entity ${entity} is missing foreign_id`);
      }
    } catch (err) {
      this.logger.error('Unable to sync deleted entity', err);
    }
  }

  /**
   * Handles the event triggered when a new NLP value is created. Synchronizes the value with the external NLP provider.
   *
   * @param value - The NLP value to be created.
   *
   * @returns The updated value after synchronization.
   */
  @OnEvent('hook:nlpValue:create')
  async handleValueCreate(value: NlpValueDocument) {
    // Synchonize new value with NLP provider
    try {
      const helper = await this.helperService.getDefaultNluHelper();
      const foreignId = await helper.addValue(value);
      this.logger.debug('New value successfully synced!', foreignId);
      return await this.nlpValueService.updateOne(value._id, {
        foreign_id: foreignId,
      });
    } catch (err) {
      this.logger.error('Unable to sync a new value', err);
      return value;
    }
  }

  /**
   * Handles the event triggered when an NLP value is updated. Synchronizes the updated value with the external NLP provider.
   *
   * @param value - The NLP value to be updated.
   */
  @OnEvent('hook:nlpValue:update')
  async handleValueUpdate(value: NlpValue) {
    // Synchonize new value with NLP provider
    try {
      const helper = await this.helperService.getDefaultNluHelper();
      await helper.updateValue(value);
      this.logger.debug('Updated value successfully synced!', value);
    } catch (err) {
      this.logger.error('Unable to sync updated value', err);
    }
  }

  /**
   * Handles the event triggered when an NLP value is deleted. Synchronizes the deletion with the external NLP provider.
   *
   * @param value - The NLP value to be deleted.
   */
  @OnEvent('hook:nlpValue:delete')
  async handleValueDelete(value: NlpValue) {
    // Synchonize new value with NLP provider
    try {
      const helper = await this.helperService.getDefaultNluHelper();
      const populatedValue = await this.nlpValueService.findOneAndPopulate(
        value.id,
      );
      if (populatedValue) {
        await helper.deleteValue(populatedValue);
        this.logger.debug('Deleted value successfully synced!', value);
      }
    } catch (err) {
      this.logger.error('Unable to sync deleted value', err);
    }
  }
}
