/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';

import { BaseSeeder } from '@/utils/generics/base-seeder';

import { ContextVarDto } from '../dto/context-var.dto';
import { ContextVarRepository } from '../repositories/context-var.repository';
import { ContextVar } from '../schemas/context-var.schema';

@Injectable()
export class ContextVarSeeder extends BaseSeeder<
  ContextVar,
  never,
  never,
  ContextVarDto
> {
  constructor(private readonly contextVarRepository: ContextVarRepository) {
    super(contextVarRepository);
  }
}
