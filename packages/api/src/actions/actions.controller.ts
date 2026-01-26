/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get } from '@nestjs/common';

import { ActionService } from './actions.service';

@Controller('action')
export class ActionsController {
  constructor(private readonly actionService: ActionService) {}

  /**
   * Retrieves available actions with JSON schemas for their input, output, and settings.
   *
   * @returns Array of action metadata with JSON schemas.
   */
  @Get()
  getActions() {
    return this.actionService.getAllSchemaDefinitions();
  }
}
