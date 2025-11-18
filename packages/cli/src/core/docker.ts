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

export const generateComposeFiles = (
  folder: string,
  services: string[],
  mode?: ComposeMode,
) => {
  const files = [`-f ${path.join(folder, 'docker-compose.yml')}`];

  services.forEach((service) => {
    files.push(`-f ${path.join(folder, `docker-compose.${service}.yml`)}`);
    if (mode) {
      const serviceTypeFile = path.join(
        folder,
        `docker-compose.${service}.${mode}.yml`,
      );
      if (fs.existsSync(serviceTypeFile)) {
        files.push(`-f ${serviceTypeFile}`);
      }
    }
  });

  if (mode) {
    const mainTypeFile = path.join(folder, `docker-compose.${mode}.yml`);
    if (fs.existsSync(mainTypeFile)) {
      files.push(`-f ${mainTypeFile}`);
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
