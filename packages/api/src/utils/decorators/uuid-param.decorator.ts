/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common';

const UUID_V4_NOT_FOUND_PIPE = new ParseUUIDPipe({
  version: '4',
  errorHttpStatusCode: HttpStatus.NOT_FOUND,
});

/**
 * Validates a route parameter as UUID v4 and maps malformed values to 404.
 *
 * @param name - Route parameter name.
 */
export function UuidParam(name: string): ParameterDecorator {
  return Param(name, UUID_V4_NOT_FOUND_PIPE);
}
