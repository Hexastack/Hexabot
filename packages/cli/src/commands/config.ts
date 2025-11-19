/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as path from 'path';

import chalk from 'chalk';
import { Command } from 'commander';

import { loadProjectConfig, updateProjectConfig } from '../core/config.js';
import { normalizePackageManager } from '../core/package-manager.js';
import { assertHexabotProject } from '../core/project.js';

export const registerConfigCommand = (program: Command) => {
  const configCommand = program.command('config').description('Project config');

  configCommand
    .command('show')
    .description('Print effective Hexabot configuration')
    .action(() => {
      const projectRoot = path.resolve(process.cwd());
      assertHexabotProject(projectRoot);
      const config = loadProjectConfig(projectRoot);
      console.log(JSON.stringify(config, null, 2));
    });

  configCommand
    .command('set <key> <value>')
    .description('Update a configuration value (dot notation)')
    .action((key: string, value: string) => {
      const projectRoot = path.resolve(process.cwd());
      assertHexabotProject(projectRoot);
      const normalizedValue = parseValue(key, value);
      const override = buildOverride(key.split('.'), normalizedValue);
      const updated = updateProjectConfig(projectRoot, override);
      console.log(chalk.green('Updated hexabot.config.json'));
      console.log(JSON.stringify(updated, null, 2));
    });
};

const parseValue = (key: string, value: string) => {
  if (key === 'packageManager') {
    return normalizePackageManager(value);
  }

  const trimmed = value.trim();
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (!Number.isNaN(Number(trimmed)) && trimmed !== '') {
    return Number(trimmed);
  }
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch (_error) {
      // fallback to string
    }
  }
  if (trimmed.includes(',') && key.endsWith('Services')) {
    return trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return trimmed;
};
const buildOverride = (
  parts: string[],
  value: unknown,
): Record<string, unknown> => {
  if (!parts.length) {
    return {};
  }

  const [head, ...rest] = parts;
  if (!head) {
    return buildOverride(rest, value);
  }

  return {
    [head]: rest.length ? buildOverride(rest, value) : value,
  };
};
