/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { HelperSetting } from '@/helper/types';
import { SettingType } from '@/setting/schemas/types';

export const CORE_NLU_HELPER_NAME = 'core-nlu-helper';

export const CORE_NLU_HELPER_NAMESPACE = 'core_nlu_helper';

export default [
  {
    group: CORE_NLU_HELPER_NAMESPACE,
    label: 'endpoint',
    value: 'http://nlu-api:5000/',
    type: SettingType.text,
  },
  {
    group: CORE_NLU_HELPER_NAMESPACE,
    label: 'token',
    value: 'token123',
    type: SettingType.text,
  },
  {
    group: CORE_NLU_HELPER_NAMESPACE,
    label: 'threshold',
    value: 0.1,
    type: SettingType.number,
    config: {
      min: 0,
      max: 1,
      step: 0.01,
    },
  },
] as const satisfies HelperSetting<typeof CORE_NLU_HELPER_NAME>[];
