/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';

export type ComposeMode = 'dev' | 'prod';

export const resolveComposeFile = (projectRoot: string, filePath: string) => {
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(projectRoot, filePath);
};

export const generateComposeFiles = (
  baseComposeFile: string,
  services: string[],
  mode?: ComposeMode,
) => {
  if (!fs.existsSync(baseComposeFile)) {
    console.error(
      chalk.red(
        `Docker compose file not found at ${baseComposeFile}. Update hexabot.config.json.`,
      ),
    );
    process.exit(1);
  }

  const composeDir = path.dirname(baseComposeFile);
  const files = [`-f ${baseComposeFile}`];

  services.forEach((service) => {
    const serviceFile = path.join(composeDir, `docker-compose.${service}.yml`);
    if (fs.existsSync(serviceFile)) {
      files.push(`-f ${serviceFile}`);
    }
    if (mode) {
      const serviceModeFile = path.join(
        composeDir,
        `docker-compose.${service}.${mode}.yml`,
      );
      if (fs.existsSync(serviceModeFile)) {
        files.push(`-f ${serviceModeFile}`);
      }
    }
  });

  if (mode) {
    const modeFile = path.join(composeDir, `docker-compose.${mode}.yml`);
    if (fs.existsSync(modeFile)) {
      files.push(`-f ${modeFile}`);
    }
  }

  return files.join(' ');
};

export const dockerCompose = (args: string) => {
  try {
    const cmd = `docker compose ${args}`;
    console.log(chalk.yellow(cmd));
    execSync(cmd, { stdio: 'inherit' });
  } catch (_error) {
    console.error(chalk.red('Error executing Docker Compose command.'));
    process.exit(1);
  }
};

export const dockerExec = (
  container: string,
  command: string,
  options?: string,
) => {
  try {
    const optionalArgs = options ? `${options} ` : '';
    const cmd = `docker exec -it ${optionalArgs}${container} ${command}`;
    console.log(chalk.bgYellow(cmd));
    execSync(cmd, {
      stdio: 'inherit',
    });
  } catch (_error) {
    console.error(chalk.red('Error executing Docker Exec command.'));
    process.exit(1);
  }
};
