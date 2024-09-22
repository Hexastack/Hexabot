/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Prop, Schema, SchemaFactory, ModelDefinition } from '@nestjs/mongoose';
import { Exclude, Type } from 'class-transformer';
import { THydratedDocument } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { TFilterPopulateFields } from '@/utils/types/filter.types';

import { NlpValue } from './nlp-value.schema';
import { NlpEntityMap } from './types';
import { Lookup } from '../dto/nlp-entity.dto';

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
   * Lookup strategy can contain : keywords, trait, free-text
   */
  @Prop({ type: [String], default: ['keywords'] })
  lookups?: Lookup[];

  /**
   * Description of the entity purpose.
   */
  @Prop({ type: String })
  doc?: string;

  /**
   * Either or not this entity a built-in (either fixtures or shipped along with the 3rd party ai).
   */
  @Prop({ type: Boolean, default: false })
  builtin?: boolean;

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
