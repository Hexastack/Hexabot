/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { HelperSetting } from '@/helper/types';

export const LOCAL_STORAGE_HELPER_NAME = 'local-storage-helper';

export const LOCAL_STORAGE_HELPER_NAMESPACE = 'local-storage-helper';

export default [] as const satisfies HelperSetting<
  typeof LOCAL_STORAGE_HELPER_NAME
>[];
