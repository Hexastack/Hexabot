/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject, OnModuleInit } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';

import { ExtensionName } from '../types/extension';

export abstract class Extension implements OnModuleInit {
  @Inject(LoggerService)
  protected readonly logger: LoggerService;

  constructor(public readonly name: ExtensionName) {}

  getName() {
    return this.name;
  }

  async onModuleInit() {}
}
