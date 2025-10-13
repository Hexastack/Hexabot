/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PopulatePipe implements PipeTransform<string, string[]> {
  transform(value: any, _metadata: ArgumentMetadata): string[] {
    if (!value || !value.populate) {
      return [];
    }

    const { populate } = value;
    const fields = populate.split(',').map((field: string) => field.trim());

    return fields;
  }
}
