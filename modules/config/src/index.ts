/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { join } from 'path';

export * from './config.module';
export * from './config.service';
export * from './config';
export * from './types';
export * from './csrf';

export const CONFIG_I18N_PATH = join(__dirname, 'i18n');
