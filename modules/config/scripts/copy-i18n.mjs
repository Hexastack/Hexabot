#!/usr/bin/env node

/**
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const src = path.join(process.cwd(), 'src', 'i18n');
const dest = path.join(process.cwd(), 'dist', 'i18n');

if (!existsSync(src)) {
  process.exit(0);
}

mkdirSync(path.join(process.cwd(), 'dist'), { recursive: true });
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
