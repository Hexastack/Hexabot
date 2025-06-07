/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { NlpMetricRepository } from '../repositories/nlp-metric.repository';
import {
  NlpMetric,
  NlpMetricFull,
  NlpMetricPopulate,
} from '../schemas/nlp-metric.schema';

@Injectable()
export class NlpMetricService extends BaseService<
  NlpMetric,
  NlpMetricPopulate,
  NlpMetricFull
> {
  constructor(readonly repository: NlpMetricRepository) {
    super(repository);
  }
}
