/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Sanitizes user input for search queries to prevent injection attacks and remove unwanted characters.
 * It removes control characters, special characters that could be used in injection payloads,
 * and limits the length of the input to a specified maximum (default 1000 characters).
 */

// TODO: Centralize the maximum character limit for message text into an exportable constant to ensure consistency across the codebase
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

    // Remove characters that can be used in injection payloads or
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
