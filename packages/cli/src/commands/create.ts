/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';
import { Command } from 'commander';

import { downloadAndExtractTemplate } from '../services/templates.js';
import { validateProjectName } from '../utils/validation.js';

const DEFAULT_TEMPLATE_REPO = 'hexastack/hexabot-template-starter';

export const registerCreateCommand = (program: Command) => {
  program
    .command('create <projectName>')
    .description('Create a new Hexabot project')
    .option(
      '--template <template>',
      'GitHub repository in the format GITHUB_USERNAME/GITHUB_REPO',
    )
    .action(async (projectName, options: { template?: string }) => {
      if (!validateProjectName(projectName)) {
        console.error(
          chalk.red(
            'Invalid project name. It should contain only lowercase letters, numbers, and dashes.',
          ),
        );
        process.exit(1);
      }

      const projectPath = path.join(process.cwd(), projectName);

      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath);
      }

      const templateRepo = options.template || DEFAULT_TEMPLATE_REPO;

      if (!options.template) {
        console.log(
          chalk.blue(
            'No project template provided, using default Hexabot starter template.',
          ),
        );
      }

      try {
        const latestTag = await fetchLatestReleaseTag(templateRepo);
        const templateUrl = `https://github.com/${templateRepo}/archive/refs/tags/${latestTag}.zip`;

        await downloadAndExtractTemplate(templateUrl, projectPath);

        logSuccessMessage(projectName);
      } catch (error) {
        console.error(chalk.red(`Error creating project:`), error);
        process.exit(1);
      }
    });
};

const fetchLatestReleaseTag = async (templateRepo: string) => {
  const response = await fetch(
    `https://api.github.com/repos/${templateRepo}/releases/latest`,
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `Failed to fetch the latest release information: ${data.message}`,
    );
  }

  return data.tag_name;
};
const logSuccessMessage = (projectName: string) => {
  console.log('\n');
  console.log(chalk.green(`🎉 Project ${projectName} created successfully.`));
  console.log('\n');
  console.log(chalk.bgYellow(`Next steps:`));
  console.log(chalk.gray(`1. Navigate to the project folder:`));
  console.log(chalk.yellow(`>> cd ${projectName}/`));
  console.log(chalk.gray(`2. Install dependencies:`));
  console.log(chalk.yellow(`>> npm i`));
  console.log(
    chalk.gray(`3. Generate "docker/.env" file and customize config:`),
  );
  console.log(chalk.yellow(`>> hexabot init`));
  console.log(chalk.gray(`4. Run 🤖:`));
  console.log(chalk.yellow(`>> hexabot dev --services ollama`));

  console.log('\n');
  console.log(
    chalk.yellow(
      `Installation will take some time, so grab a coffee and let's pretend it's all part of the plan! 😄`,
    ),
  );
};
