/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { LabelDto } from '../dto/label.dto';
import { LabelRepository } from '../repositories/label.repository';
import { Label, LabelFull, LabelPopulate } from '../schemas/label.schema';

@Injectable()
export class LabelService extends BaseService<
  Label,
  LabelPopulate,
  LabelFull,
  LabelDto
> {
  constructor(readonly repository: LabelRepository) {
    super(repository);
  }
}
