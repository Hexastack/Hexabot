/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Type } from 'class-transformer';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { NlpValue } from './nlp-value.schema';
import { Lookup, LookupStrategy, NlpEntityMap } from './types';

@Schema({ timestamps: true })
export class NlpEntityStub extends BaseSchema {
  /**
   * This entity foreign id (nlp provider).
   */
  @Prop({ type: String, required: false, unique: false })
  foreign_id?: string;

  /**
   * The entity name.
   */
  @Prop({
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9_]+$/,
  })
  name: string;

  /**
   * Lookup strategy
   */
  @Prop({
    type: [String],
    default: ['keywords'],
    validate: {
      validator: (lookups: string[]) =>
        lookups.every((lookup) =>
          Object.values(LookupStrategy).includes(lookup as LookupStrategy),
        ),
    },
  })
  lookups: Lookup[];

  /**
   * Description of the entity purpose.
   */
  @Prop({ type: String })
  doc?: string;

  /**
   * Either or not this entity a built-in (either fixtures or shipped along with the 3rd party ai).
   */
  @Prop({ type: Boolean, default: false })
  builtin: boolean;

  /**
   * Entity's weight used to determine the next block to trigger in the conversational flow.
   */
  @Prop({
    type: Number,
    default: 1,
    validate: {
      validator: (value: number) => value > 0,
      message: 'Weight must be a strictly positive number',
    },
  })
  weight: number;

  /**
   * Returns a map object for entities
   * @param entities - Array of entities
   * @returns {NlpEntityMap} - Object that contains entities identified by key=entity.id
   
   */
  static getEntityMap<T extends NlpEntityStub>(entities: T[]) {
    return entities.reduce((acc, curr: T) => {
      acc[curr.id] = curr;
      return acc;
    }, {} as NlpEntityMap<T>);
  }
}

@Schema({ timestamps: true })
export class NlpEntity extends NlpEntityStub {
  @Exclude()
  values?: never;
}

@Schema({ timestamps: true })
export class NlpEntityFull extends NlpEntityStub {
  @Type(() => NlpValue)
  values: NlpValue[];
}

export type NlpEntityDocument = THydratedDocument<NlpEntity>;

export const NlpEntityModel: ModelDefinition = LifecycleHookManager.attach({
  name: NlpEntity.name,
  schema: SchemaFactory.createForClass(NlpEntityStub),
});

NlpEntityModel.schema.virtual('values', {
  ref: 'NlpValue',
  localField: '_id',
  foreignField: 'entity',
});

export default NlpEntityModel.schema;

export type NlpEntityPopulate = keyof TFilterPopulateFields<
  NlpEntity,
  NlpEntityStub
>;

export const NLP_ENTITY_POPULATE: NlpEntityPopulate[] = ['values'];
