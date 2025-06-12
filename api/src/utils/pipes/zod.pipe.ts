/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
