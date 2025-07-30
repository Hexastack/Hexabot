/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { LabelGroupDto } from '../dto/label-group.dto';
import { LabelGroupRepository } from '../repositories/label-group.repository';
import { LabelGroup } from '../schemas/label-group.schema';

@Injectable()
export class LabelGroupService extends BaseService<
  LabelGroup,
  never,
  never,
  LabelGroupDto
> {
  constructor(readonly repository: LabelGroupRepository) {
    super(repository);
  }
}
