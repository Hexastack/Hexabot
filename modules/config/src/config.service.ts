/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { config } from './config';
import { Config } from './types';

@Injectable()
export class ConfigService {
  private readonly config = config;

  get<T extends keyof Config>(key: T): Config[T] {
    return this.config[key];
  }

  all(): Config {
    return this.config;
  }
}
