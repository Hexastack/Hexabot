/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
