/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude, Transform, Type } from 'class-transformer';
import { Schema as MongooseSchema, THydratedDocument } from 'mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';

import { Category } from './category.schema';
import { Label } from './label.schema';
import { CaptureVar } from './types/capture-var';
import { BlockMessage } from './types/message';
import { BlockOptions } from './types/options';
import { Pattern } from './types/pattern';
import { Position } from './types/position';
import { isValidMessage } from '../validation-rules/is-message';
import { isPatternList } from '../validation-rules/is-pattern-list';
import { isPosition } from '../validation-rules/is-position';
import { isValidVarCapture } from '../validation-rules/is-valid-capture';

@Schema({ timestamps: true })
export class BlockStub extends BaseSchema {
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: Object,
    validate: isPatternList,
    default: [],
  })
  patterns?: Pattern[];

  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Label',
      default: [],
    },
  ])
  trigger_labels?: unknown;

  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Label',
      default: [],
    },
  ])
  assign_labels?: unknown;

  @Prop({
    type: Object,
    default: [],
  })
  trigger_channels?: string[];

  @Prop({
    type: Object,
    default: {},
  })
  options?: BlockOptions;

  @Prop({
    type: Object,
    validate: isValidMessage,
  })
  message: BlockMessage;

  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Block',
      default: [],
    },
  ])
  nextBlocks?: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Block',
  })
  attachedBlock?: unknown;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
  })
  category: unknown;

  @Prop({
    type: Boolean,
    default: false,
  })
  starts_conversation?: boolean;

  @Prop({
    type: Object,
    validate: isValidVarCapture,
    default: [],
  })
  capture_vars?: CaptureVar[];

  @Prop({
    type: Object,
    validate: isPosition,
  })
  position: Position;

  @Prop({
    type: Boolean,
    default: false,
  })
  builtin?: boolean;
}

@Schema({ timestamps: true })
export class Block extends BlockStub {
  @Transform(({ obj }) => obj.trigger_labels?.map((elem) => elem.toString()))
  trigger_labels?: string[];

  @Transform(({ obj }) => obj.assign_labels?.map((elem) => elem.toString()))
  assign_labels?: string[];

  @Transform(({ obj }) => obj.nextBlocks?.map((elem) => elem.toString()))
  nextBlocks?: string[];

  @Transform(({ obj }) => obj.attachedBlock?.toString() || null)
  attachedBlock?: string;

  @Transform(({ obj }) => obj.category.toString())
  category: string;

  @Exclude()
  previousBlocks?: never;

  @Exclude()
  attachedToBlock?: never | null;
}

@Schema({ timestamps: true })
export class BlockFull extends BlockStub {
  @Type(() => Label)
  trigger_labels: Label[];

  @Type(() => Label)
  assign_labels: Label[];

  @Type(() => Block)
  nextBlocks?: Block[];

  @Type(() => Block)
  attachedBlock?: Block;

  @Type(() => Category)
  category: Category;

  @Type(() => Block)
  previousBlocks: Block[];

  @Type(() => Block)
  attachedToBlock?: Block;
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

export default BlockModel.schema;
