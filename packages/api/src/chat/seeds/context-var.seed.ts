/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseSeeder } from '@/utils/generics/base-seeder';

import { ContextVar, ContextVarDto } from '../dto/context-var.dto';
import { ContextVarRepository } from '../repositories/context-var.repository';

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
