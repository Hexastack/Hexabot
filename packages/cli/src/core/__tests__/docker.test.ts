/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { jest } from '@jest/globals';

import { generateComposeFiles } from '../docker.js';

describe('generateComposeFiles', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexabot-docker-'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('builds the compose file list for provided services', () => {
    const result = generateComposeFiles(tempDir, ['api', 'db']);

    expect(result).toBe(
      `-f ${path.join(tempDir, 'docker-compose.yml')} ` +
        `-f ${path.join(tempDir, 'docker-compose.api.yml')} ` +
        `-f ${path.join(tempDir, 'docker-compose.db.yml')}`,
    );
  });

  it('includes mode specific service and main files when they exist', () => {
    const serviceModeFile = path.join(tempDir, 'docker-compose.api.dev.yml');
    const mainModeFile = path.join(tempDir, 'docker-compose.dev.yml');
    fs.writeFileSync(serviceModeFile, '');
    fs.writeFileSync(mainModeFile, '');

    const result = generateComposeFiles(tempDir, ['api'], 'dev');

    expect(result).toBe(
      `-f ${path.join(tempDir, 'docker-compose.yml')} ` +
        `-f ${path.join(tempDir, 'docker-compose.api.yml')} ` +
        `-f ${serviceModeFile} -f ${mainModeFile}`,
    );
  });
});
