/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';

const DOCKER_FOLDER_NAME = 'docker';

export const resolveDockerFolder = () => {
  return path.resolve(process.cwd(), `./${DOCKER_FOLDER_NAME}`);
};

export const ensureDockerFolder = () => {
  const folder = resolveDockerFolder();

  if (!fs.existsSync(folder)) {
    console.error(
      chalk.red(`Error: The '${DOCKER_FOLDER_NAME}' folder is not found in the current directory.`),
    );
    console.error(
      chalk.yellow(
        `Please make sure you're in the Hexabot project directory and try again.`,
      ),
    );
    console.log(chalk.cyan(`Example: cd path/to/hexabot`));
    process.exit(1);
  }

  return folder;
};
