/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { THydratedDocument } from '@/utils/types/filter.types';

import { MigrationAction, MigrationVersion } from './types';

@Schema({ timestamps: true })
export class Migration {
  @Prop({ type: String, required: true, unique: true })
  version: MigrationVersion;

  @Prop({ type: String, required: true, enum: Object.values(MigrationAction) })
  status: MigrationAction;
}

export const MigrationModel: ModelDefinition = LifecycleHookManager.attach({
  name: Migration.name,
  schema: SchemaFactory.createForClass(Migration),
});

export default MigrationModel.schema;

export type MigrationDocument = THydratedDocument<Migration>;
