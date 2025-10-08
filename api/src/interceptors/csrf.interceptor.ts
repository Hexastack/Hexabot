/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';
import {
  CsrfMiddlewareOptions,
  CsrfInterceptor as NestjsCsrfInterceptor,
} from '@tekuconcept/nestjs-csrf';

@Injectable()
export class CsrfInterceptor extends NestjsCsrfInterceptor {
  constructor(options: CsrfMiddlewareOptions = {}) {
    super({
      methods: {
        create: ['GET', 'POST', 'PATCH', 'DELETE'],
        validate: ['GET', 'POST', 'PATCH', 'DELETE'],
      },
      ...options,
    });
  }
}
