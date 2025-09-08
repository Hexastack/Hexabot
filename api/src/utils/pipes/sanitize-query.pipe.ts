/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Sanitizes user input for search queries to prevent injection attacks and remove unwanted characters.
 * It removes control characters, special characters that could be used in injection payloads,
 * and limits the length of the input to a specified maximum (default 1000 characters).
 **/

// TODO: Centralize the maximum character limit for block text messages into an exportable constant to ensure consistency across the codebase
const MAX_BLOCK_TEXT_MESSAGE_LENGTH = 1000;

@Injectable()
export class SanitizeQueryPipe implements PipeTransform<string, string> {
  static sanitize(
    input: unknown,
    maxLength = MAX_BLOCK_TEXT_MESSAGE_LENGTH,
  ): string {
    if (typeof input !== 'string') return '';

    let s = input.trim();

    // Remove C0 control characters (null..US) and DEL without regex control ranges (Biome-safe)
    s = Array.from(s)
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        return code >= 0x20 && code !== 0x7f;
      })
      .join('');

    // Remove characters that can be used in injection payloads for MongoDB or
    // shell-like expressions: dollar sign, braces, semicolon, backslash, slashes.
    s = s.replace(/[\$\{\}\;\\\/]/g, ' ');

    // Remove quotes so users can't prematurely close quoted phrases in text search
    s = s.replace(/["']/g, ' ');

    // Remove other regex/meta characters that could change query semantics
    s = s.replace(/[\^\*\?\+\(\)\[\]\|]/g, ' ');

    if (s.length > maxLength) s = s.slice(0, maxLength);

    return s.trim();
  }

  constructor(private readonly maxLength = MAX_BLOCK_TEXT_MESSAGE_LENGTH) {}

  transform(value: any, _metadata: ArgumentMetadata): string {
    return SanitizeQueryPipe.sanitize(value, this.maxLength);
  }
}
