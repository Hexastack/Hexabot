/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { In } from 'typeorm';

import { HelperService } from '@/helper/helper.service';
import { HelperType, NLU } from '@/helper/types';
import { LoggerService } from '@/logger/logger.service';
import { TFilterQuery } from '@/utils/types/filter.types';

import { NlpEntity, NlpEntityFull } from '../dto/nlp-entity.dto';
import { NlpValue, NlpValueFull } from '../dto/nlp-value.dto';

import { NlpEntityService } from './nlp-entity.service';
import { NlpSampleEntityService } from './nlp-sample-entity.service';
import { NlpSampleService } from './nlp-sample.service';
import { NlpValueService } from './nlp-value.service';

type HelperEntityPayload = Omit<NlpEntityFull, 'values'> & {
  values?: NlpValue[];
};

const mapValueForHelper = (value: NlpValueFull | NlpValue): NlpValue => {
  const { entity, ...rest } = value as NlpValueFull;
  const entityId =
    typeof entity === 'object' ? (entity.id as string) : (entity as string);

  return {
    ...(rest as unknown as Omit<NlpValue, 'entity'>),
    entity: entityId,
  };
};

const mapEntityForHelper = (entity: NlpEntityFull): HelperEntityPayload => {
  const { values, ...rest } = entity;

  return {
    ...rest,
    values: values?.map((value) => mapValueForHelper(value)),
  };
};

@Injectable()
export class NlpService {
  constructor(
    private readonly logger: LoggerService,
    protected readonly nlpSampleService: NlpSampleService,
    protected readonly nlpEntityService: NlpEntityService,
    protected readonly nlpValueService: NlpValueService,
    protected readonly helperService: HelperService,
    protected readonly nlpSampleEntityService: NlpSampleEntityService,
  ) {}

  /**
   * Computes a prediction score for each parsed NLU entity based on its confidence and a predefined weight.
   *
   * `score = confidence * weight`
   *
   * If a weight is not defined for a given entity, a default of 1 is used.
   *
   * @param input - The input object containing parsed entities.
   * @param input.entities - The list of entities returned from NLU inference.
   *
   * @returns A promise that resolves to a list of scored entities.
   */
  async computePredictionScore({
    entities,
  }: NLU.ParseEntities): Promise<NLU.ScoredEntities> {
    const nlpMap = await this.nlpEntityService.getNlpMap();

    const scoredEntities = entities
      .filter(({ entity }) => nlpMap.has(entity))
      .map((e) => {
        const entity = nlpMap.get(e.entity)!;

        return {
          ...e,
          score: e.confidence * (entity.weight || 1),
        };
      });

    return { entities: scoredEntities };
  }

  /**
   * Handles the event triggered when a new NLP entity is created. Synchronizes the entity with the external NLP provider.
   *
   * @param entity - The NLP entity to be created.
   */
  @OnEvent('hook:nlpEntity:postCreate')
  async handleEntityPostCreate(created: NlpEntity) {
    if (created.builtin) {
      return;
    }

    try {
      const helper = await this.helperService.getDefaultHelper(HelperType.NLU);
      const entityFull = await this.nlpEntityService.findOneAndPopulate(
        created.id,
      );

      if (!entityFull) {
        return;
      }

      const helperPayload = mapEntityForHelper(entityFull);
      const foreignId = await helper.addEntity(
        helperPayload as unknown as NlpEntity,
      );
      this.logger.debug('New entity successfully synced!', foreignId);
      await this.nlpEntityService.updateOne(created.id, {
        foreignId,
      });
    } catch (err) {
      this.logger.error('Unable to sync a new entity', err);
    }
  }

  /**
   * Handles the event triggered when an NLP entity is updated. Synchronizes the updated entity with the external NLP provider.
   *
   * @param entity - The NLP entity to be updated.
   */
  @OnEvent('hook:nlpEntity:postUpdate')
  async handleEntityPostUpdate(payload: {
    entity: NlpEntity;
    previous: NlpEntity;
  }) {
    const updated = payload?.entity;

    if (!updated || updated.builtin) {
      return;
    }

    try {
      const helper = await this.helperService.getDefaultHelper(HelperType.NLU);
      const entityFull = await this.nlpEntityService.findOneAndPopulate(
        updated.id,
      );

      if (!entityFull) {
        return;
      }

      await helper.updateEntity(
        mapEntityForHelper(entityFull) as unknown as NlpEntity,
      );
      this.logger.debug('Updated entity successfully synced!', updated);
    } catch (err) {
      this.logger.error('Unable to sync updated entity', err);
    }
  }

  /**
   * Before deleting a `nlpEntity`, this method deletes the related `nlpValue` and `nlpSampleEntity`. Synchronizes the deletion with the external NLP provider
   *
   * @param _query - The Mongoose query object used for deletion.
   * @param criteria - The filter criteria for finding the nlpEntities to be deleted.
   */
  @OnEvent('hook:nlpEntity:preDelete')
  async handleEntityDelete(payload: {
    entities: NlpEntity[];
    filter: TFilterQuery<NlpEntity>;
  }): Promise<void> {
    const entities = payload?.entities ?? [];

    if (!entities.length) {
      return;
    }

    const entityIds = entities.map((entity) => entity.id);

    await Promise.all([
      this.nlpValueService.deleteMany({
        where: { entity: In(entityIds) },
      }),
      this.nlpSampleEntityService.deleteMany({
        where: { entity: In(entityIds) },
      }),
    ]);

    const helper = await this.helperService.getDefaultHelper(HelperType.NLU);

    for (const entity of entities) {
      if (entity.builtin) {
        continue;
      }

      try {
        if (entity.foreignId) {
          await helper.deleteEntity(entity.foreignId);
          this.logger.debug('Deleted entity successfully synced!', entity);
        } else {
          this.logger.error(`Entity ${entity.id} is missing foreignId`);
          throw new NotFoundException(
            `Entity ${entity.id} is missing foreignId`,
          );
        }
      } catch (err) {
        this.logger.error('Unable to sync deleted entity', err);
      }
    }
  }

  /**
   * Handles the event triggered when a new NLP value is created. Synchronizes the value with the external NLP provider.
   *
   * @param value - The NLP value to be created.
   */
  @OnEvent('hook:nlpValue:postCreate')
  async handleValuePostCreate(created: NlpValue) {
    if (created.builtin) {
      return;
    }

    try {
      const helper = await this.helperService.getDefaultHelper(HelperType.NLU);
      const valueFull = await this.nlpValueService.findOneAndPopulate(
        created.id,
      );

      if (!valueFull) {
        return;
      }

      const helperValuePayload = mapValueForHelper(valueFull);
      const foreignId = await helper.addValue(helperValuePayload);
      this.logger.debug('New value successfully synced!', foreignId);
      await this.nlpValueService.updateOne(created.id, {
        foreignId,
      });
    } catch (err) {
      this.logger.error('Unable to sync a new value', err);
    }
  }

  /**
   * Handles the event triggered when an NLP value is updated. Synchronizes the updated value with the external NLP provider.
   *
   * @param value - The NLP value to be updated.
   */
  @OnEvent('hook:nlpValue:postUpdate')
  async handleValuePostUpdate(payload: {
    entity: NlpValue;
    previous: NlpValue;
  }) {
    const updated = payload?.entity;

    if (!updated || updated.builtin) {
      return;
    }

    try {
      const helper = await this.helperService.getDefaultHelper(HelperType.NLU);
      const valueFull = await this.nlpValueService.findOneAndPopulate(
        updated.id,
      );

      if (!valueFull) {
        return;
      }

      await helper.updateValue(mapValueForHelper(valueFull));
      this.logger.debug('Updated value successfully synced!', updated);
    } catch (err) {
      this.logger.error('Unable to sync updated value', err);
    }
  }

  /**
   * Before deleting a `nlpValue`, this method deletes the related `nlpSampleEntity`. Synchronizes the deletion with the external NLP provider
   *
   * @param _query - The Mongoose query object used for deletion.
   * @param criteria - The filter criteria for finding the nlpValues to be deleted.
   */
  @OnEvent('hook:nlpValue:preDelete')
  async handleValueDelete(payload: {
    entities: NlpValue[];
    filter: TFilterQuery<NlpValue>;
  }): Promise<void> {
    const entities = payload?.entities ?? [];

    if (!entities.length) {
      return;
    }

    const valueIds = entities.map((value) => value.id);

    await this.nlpSampleEntityService.deleteMany({
      where: { value: In(valueIds) },
    });

    const helper = await this.helperService.getDefaultHelper(HelperType.NLU);

    for (const value of entities) {
      if (value.builtin) {
        continue;
      }

      try {
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
}
