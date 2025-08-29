/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Schema as MongooseSchema } from 'mongoose';
import { z } from 'zod';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { buildZodSchemaValidator } from '@/utils/helpers/zod-validation';
import {
  TFilterPopulateFields,
  THydratedDocument,
} from '@/utils/types/filter.types';

import { Category } from './category.schema';
import { Label } from './label.schema';
import { CaptureVar, captureVarSchema } from './types/capture-var';
import { BlockMessage, blockMessageObjectSchema } from './types/message';
import { BlockOptions } from './types/options';
import { Pattern, patternSchema } from './types/pattern';
import { Position, positionSchema } from './types/position';

@Schema({ timestamps: true })
export class BlockStub extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  name: string;

  @Prop({
    type: Object,
    validate: buildZodSchemaValidator(z.array(patternSchema)),
    default: [],
  })
  patterns: Pattern[];

  @Prop({
    type: Object,
    default: [],
  })
  outcomes: string[];

  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Label',
      default: [],
    },
  ])
  trigger_labels: unknown;

  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Label',
      default: [],
    },
  ])
  assign_labels: unknown;

  @Prop({
    type: Object,
    default: [],
  })
  trigger_channels: string[];

  @Prop({
    type: Object,
    default: {},
  })
  options: BlockOptions;

  @Prop({
    type: Object,
    validate: buildZodSchemaValidator(blockMessageObjectSchema),
  })
  message: BlockMessage;

  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Block',
      default: [],
    },
  ])
  nextBlocks: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Block',
  })
  attachedBlock: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
  })
  category: unknown;

  @Prop({
    type: Boolean,
    default: false,
  })
  starts_conversation: boolean;

  @Prop({
    type: Object,
    validate: buildZodSchemaValidator(z.array(captureVarSchema)),
    default: [],
  })
  capture_vars: CaptureVar[];

  @Prop({
    type: Object,
    validate: buildZodSchemaValidator(positionSchema),
  })
  position: Position;

  @Prop({
    type: Boolean,
    default: false,
  })
  builtin: boolean;
}

@Schema({ timestamps: true })
export class Block extends BlockStub {
  @Transform(({ obj }) => obj.trigger_labels.map((elem) => elem.toString()))
  trigger_labels: string[];

  @Transform(({ obj }) => obj.assign_labels.map((elem) => elem.toString()))
  assign_labels: string[];

  @Transform(({ obj }) => obj.nextBlocks.map((elem) => elem.toString()))
  nextBlocks: string[];

  @Transform(({ obj }) =>
    obj.attachedBlock ? obj.attachedBlock.toString() : null,
  )
  attachedBlock: string | null;

  @Transform(({ obj }) => (obj.category ? obj.category.toString() : null))
  category: string | null;

  @Exclude()
  previousBlocks?: never;

  @Exclude()
  attachedToBlock?: never;
}

@Schema({ timestamps: true })
export class BlockFull extends BlockStub {
  @Type(() => Label)
  trigger_labels: Label[];

  @Type(() => Label)
  assign_labels: Label[];

  @Type(() => Block)
  nextBlocks: Block[];

  @Type(() => Block)
  attachedBlock: Block | null;

  @Type(() => Category)
  category: Category | null;

  @Type(() => Block)
  previousBlocks?: Block[];

  @Type(() => Block)
  attachedToBlock?: Block;
}

// Full block document with text search score attached
export class SearchRankedBlock extends Block {
  @Expose()
  @Transform(({ value }) => (typeof value === 'number' ? value : 0))
  score!: number;
}

export type BlockDocument = THydratedDocument<Block>;

export const BlockModel: ModelDefinition = LifecycleHookManager.attach({
  name: Block.name,
  schema: SchemaFactory.createForClass(BlockStub),
});

BlockModel.schema.virtual('previousBlocks', {
  ref: 'Block',
  localField: '_id',
  foreignField: 'nextBlocks',
  justOne: false,
});

BlockModel.schema.virtual('attachedToBlock', {
  ref: 'Block',
  localField: '_id',
  foreignField: 'attachedBlock',
  justOne: true,
});

BlockModel.schema.index(
  {
    name: 'text',
    message: 'text',
    'message.text': 'text',
    'options.fallback.message': 'text',
    'message.args': 'text',
  },
  {
    weights: {
      name: 5,
      message: 2,
      'message.text': 2,
      'message.args': 2,
      'options.fallback.message': 1,
    },
    name: 'block_search_index',
    default_language: 'none',
  },
);

export default BlockModel.schema;

export type BlockPopulate = keyof TFilterPopulateFields<Block, BlockStub>;

export const BLOCK_POPULATE: BlockPopulate[] = [
  'trigger_labels',
  'assign_labels',
  'nextBlocks',
  'attachedBlock',
  'category',
  'previousBlocks',
  'attachedToBlock',
];
