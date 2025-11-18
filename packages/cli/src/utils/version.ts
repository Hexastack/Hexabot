/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const INITIAL_CLI_VERSION = '2.0.0';

export const getCliVersion = (readFile: typeof fs.readFileSync = fs.readFileSync) => {
  try {
    // @ts-ignore ts-jest currently transpiles tests in CommonJS mode and flags import.meta access.
    const filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(filename);
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFile(packageJsonPath, 'utf-8'));

    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error);

    return INITIAL_CLI_VERSION;
  }
};
