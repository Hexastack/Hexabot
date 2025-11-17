/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import 'dotenv/config';

import { HexabotApplicationModule } from './app.module';
import { bootstrapHexabotApp } from './bootstrap';

bootstrapHexabotApp(HexabotApplicationModule);
