/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { bindingKinds } from '@/actions/runtime-bindings';
import { toDraft07JsonSchema } from '@/utils/helpers/zod';

@Injectable()
export class RuntimeBindingsService {
  getAllSchemaDefinitions() {
    return Object.fromEntries(
      Object.entries(bindingKinds).map(([bindingKind, bindingSchema]) => [
        bindingKind,
        toDraft07JsonSchema(bindingSchema),
      ]),
    );
  }
}
