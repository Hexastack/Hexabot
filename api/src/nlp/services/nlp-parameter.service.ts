/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { NlpParameterRepository } from '../repositories/nlp-parameter.repository';
import {
  NlpParameter,
  NlpParameterFull,
  NlpParameterPopulate,
} from '../schemas/nlp-parameter.schema';

@Injectable()
export class NlpParameterService extends BaseService<
  NlpParameter,
  NlpParameterPopulate,
  NlpParameterFull
> {
  constructor(readonly repository: NlpParameterRepository) {
    super(repository);
  }
}
