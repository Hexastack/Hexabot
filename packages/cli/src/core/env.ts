/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';

import type { HexabotConfig } from './config.js';

export interface EnvBootstrapOptions {
  force?: boolean;
  quiet?: boolean;
}

export const bootstrapEnvFile = (
  projectRoot: string,
  exampleFile: string,
  targetFile: string,
  options: EnvBootstrapOptions = {},
) => {
  const examplePath = path.join(projectRoot, exampleFile);
  const targetPath = path.join(projectRoot, targetFile);

  if (!fs.existsSync(examplePath)) {
    console.log(
      chalk.yellow(
        `Example env file "${exampleFile}" is missing. Skipping bootstrap.`,
      ),
    );

    return false;
  }

  if (!options.force && fs.existsSync(targetPath)) {
    if (!options.quiet) {
      console.log(
        chalk.gray(
          `Env file "${targetFile}" already exists. Use --force to overwrite.`,
        ),
      );
    }

    return false;
  }

  fs.copyFileSync(examplePath, targetPath);
  if (!options.quiet) {
    console.log(
      chalk.green(`Generated ${targetFile} from ${exampleFile}. Customize it!`),
    );
  }

  return true;
};

export const listEnvStatus = (projectRoot: string, config: HexabotConfig) => {
  const entries = [
    config.env.localExample,
    config.env.local,
    config.env.dockerExample,
    config.env.docker,
  ];

  return entries.map((file) => ({
    file,
    path: path.join(projectRoot, file),
    exists: fs.existsSync(path.join(projectRoot, file)),
  }));
};

export const resolveEnvExample = (
  projectRoot: string,
  envFile: string | undefined,
  defaultExample: string,
) => {
  if (!envFile) {
    return defaultExample;
  }

  const candidate = `${envFile}.example`;
  if (fs.existsSync(path.join(projectRoot, candidate))) {
    return candidate;
  }

  return defaultExample;
};

const ENV_BARE_VALUE = /^[A-Za-z0-9._/:@-]*$/;
const formatEnvValue = (value: string) => {
  if (ENV_BARE_VALUE.test(value)) {
    return value;
  }

  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')}"`;
};
const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const upsertEnvVariables = (
  projectRoot: string,
  envFile: string,
  values: Record<string, string>,
) => {
  const envPath = path.join(projectRoot, envFile);
  if (!fs.existsSync(envPath)) {
    throw new Error(`Env file "${envFile}" is missing.`);
  }

  const source = fs.readFileSync(envPath, 'utf-8');
  let lines = source.length > 0 ? source.split(/\r?\n/) : [];

  // Remove trailing blank line to avoid repetitive gaps after writes.
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  for (const [key, rawValue] of Object.entries(values)) {
    const keyPattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=`);
    const nextLine = `${key}=${formatEnvValue(rawValue)}`;
    let updated = false;
    const nextLines: string[] = [];

    for (const line of lines) {
      if (!keyPattern.test(line)) {
        nextLines.push(line);
        continue;
      }

      if (!updated) {
        nextLines.push(nextLine);
        updated = true;
      }
      // Skip duplicate declarations for the same key.
    }

    if (!updated) {
      nextLines.push(nextLine);
    }

    lines = nextLines;
  }

  fs.writeFileSync(envPath, `${lines.join('\n')}\n`, 'utf-8');
};
