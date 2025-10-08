/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodTypeAny } from 'zod';

/**
 * Validates a single query-parameter with a given Zod schema.
 *
 * @example
 * // Controller usage
 * @Get()
 * listUsers(
 *   @Query(new ZodQueryParamPipe(z.coerce.number().int().min(1))) query: any,
 * ) {
 *   // query.page is guaranteed to be a positive integer number
 * }
 */
@Injectable()
export class ZodQueryParamPipe implements PipeTransform {
  constructor(
    private readonly schema: ZodTypeAny,
    private readonly accessor?: (query: any) => any,
  ) {}

  async transform(query: any, metadata: ArgumentMetadata) {
    const payload = this.accessor ? this.accessor(query) : query;
    // We care only about query params
    if (typeof payload === 'undefined' || metadata.type !== 'query') {
      return payload;
    }

    const parsed = this.schema.safeParse(payload);

    if (!parsed.success) {
      // Optionally format the error for client readability
      const error = parsed.error as ZodError;
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Validation failed for query param`,
        details: error.flatten(),
      });
    }

    // Return a new query object with the parsed value injected
    return parsed.data;
  }
}
