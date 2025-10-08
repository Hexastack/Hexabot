/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { HelperSetting } from '@/helper/types';
import { SettingType } from '@/setting/schemas/types';

export const TEST_HELPER_NAME = 'test-helper';

export const TEST_HELPER_NAMESPACE = 'test_helper';

export default [
  {
    group: TEST_HELPER_NAMESPACE,
    label: 'test',
    value: 'test',
    type: SettingType.text,
  },
] as const satisfies HelperSetting<typeof TEST_HELPER_NAME>[];
