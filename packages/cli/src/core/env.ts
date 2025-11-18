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
