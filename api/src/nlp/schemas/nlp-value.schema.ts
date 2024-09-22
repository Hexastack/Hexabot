/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import { THydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { TFilterPopulateFields } from '@/utils/types/filter.types';

import { NlpEntity, NlpEntityFull } from './nlp-entity.schema';
import { NlpValueMap } from './types';

@Schema({ timestamps: true })
export class NlpValueStub extends BaseSchema {
  /**
   * This value content.
   */
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  /**
   * This value content.
   */
  @Prop({ type: String, required: true, unique: true })
  value: string;

  /**
   * An array of synonyms or equivalent words that fits this value.
   */
  @Prop({ type: [String], default: [] })
  expressions?: string[];

  /**
   * Metadata are additional data that can be associated to this values, most of the time, the metadata contains system values or ids (e.g: value: "coffee", metadata: "item_11") .
   */
  @Prop({ type: JSON, default: {} })
  metadata?: Record<string, any>;

  /**
   * Either or not this value a built-in (either fixtures or shipped along with the 3rd party ai).
   */
  @Prop({ type: Boolean, default: false })
  builtin?: boolean;

  /**
   * The entity to which this value belongs to.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NlpEntity',
    required: true,
  })
  entity: unknown;

  /**
   * Returns array of values of all the provided entities
   * @param entities - Array of entities
   * @returns {NlpValue[]} - Array that contains all entities values
   
   */
  static getValuesFromEntities(entities: NlpEntityFull[]): NlpValue[] {
    return entities.reduce((acc, curr: NlpEntityFull) => {
      return acc.concat(curr.values);
    }, [] as NlpValue[]);
  }

  /**
   * Returns a map object for values
   * @param values - Array of values
   * @returns {NlpValueMap} - Object that contains values identified by key=value.id
   
   */
  static getValueMap<T extends NlpValueStub>(values: T[]): NlpValueMap<T> {
    return values.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {} as NlpValueMap<T>);
  }
}

@Schema({ timestamps: true })
export class NlpValue extends NlpValueStub {
  @Transform(({ obj }) => obj.entity.toString())
  entity: string;
}

@Schema({ timestamps: true })
export class NlpValueFull extends NlpValueStub {
  @Type(() => NlpEntity)
  entity: NlpEntity;
}

export type NlpValueDocument = THydratedDocument<NlpValue>;

export const NlpValueModel: ModelDefinition = LifecycleHookManager.attach({
  name: NlpValue.name,
  schema: SchemaFactory.createForClass(NlpValueStub),
});

export default NlpValueModel.schema;

export type NlpValuePopulate = keyof TFilterPopulateFields<
  NlpValue,
  NlpValueStub
>;

export const NLP_VALUE_POPULATE: NlpValuePopulate[] = ['entity'];
