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
  let composeFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexabot-docker-'));
    composeFile = path.join(tempDir, 'docker-compose.yml');
    fs.writeFileSync(composeFile, '');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('builds the compose file list for provided services', () => {
    const apiFile = path.join(tempDir, 'docker-compose.api.yml');
    const dbFile = path.join(tempDir, 'docker-compose.db.yml');
    fs.writeFileSync(apiFile, '');
    fs.writeFileSync(dbFile, '');

    const result = generateComposeFiles(composeFile, ['api', 'db']);

    expect(result).toBe(
      `-f ${composeFile} ` + `-f ${apiFile} ` + `-f ${dbFile}`,
    );
  });

  it('includes mode specific service and main files when they exist', () => {
    const apiFile = path.join(tempDir, 'docker-compose.api.yml');
    const serviceModeFile = path.join(tempDir, 'docker-compose.api.dev.yml');
    const mainModeFile = path.join(tempDir, 'docker-compose.dev.yml');
    fs.writeFileSync(apiFile, '');
    fs.writeFileSync(serviceModeFile, '');
    fs.writeFileSync(mainModeFile, '');

    const result = generateComposeFiles(composeFile, ['api'], 'dev');

    expect(result).toBe(
      `-f ${composeFile} ` +
        `-f ${apiFile} ` +
        `-f ${serviceModeFile} -f ${mainModeFile}`,
    );
  });
});
