/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

import { MigrationAction } from './types';

@Schema({ timestamps: true })
export class Migration {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, enum: MigrationAction })
  status: string;
}

export const MigrationSchema = SchemaFactory.createForClass(Migration);

export type MigrationDocument = Migration & Document;

export type MigrationModel = Model<MigrationDocument>;
