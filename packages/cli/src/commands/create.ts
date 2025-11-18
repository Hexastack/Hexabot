/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';
import { Command } from 'commander';

import { ensureProjectConfig, loadProjectConfig } from '../core/config.js';
import { bootstrapEnvFile } from '../core/env.js';
import {
  detectPackageManager,
  installDependencies,
  normalizePackageManager,
} from '../core/package-manager.js';
import { downloadAndExtractTemplate } from '../services/templates.js';
import { validateProjectName } from '../utils/validation.js';

import { runDev } from './dev.js';

const DEFAULT_TEMPLATE_REPO = 'hexastack/hexabot-template-starter';

interface CreateCommandOptions {
  template?: string;
  pm?: string;
  noInstall?: boolean;
  dev?: boolean;
  docker?: boolean;
  force?: boolean;
}

export const registerCreateCommand = (program: Command) => {
  program
    .command('create <projectName>')
    .description('Create a new Hexabot project from the starter')
    .option(
      '-t, --template <name>',
      'Project template to use (default: starter)',
    )
    .option('--pm <npm|pnpm|yarn|bun>', 'Preferred package manager')
    .option('--no-install', 'Skip installing dependencies')
    .option('--dev', 'Run hexabot dev after creation')
    .option('--docker', 'Bootstrap Docker env files during creation')
    .option('--force', 'Allow scaffolding into a non-empty directory')
    .action(async (projectName: string, options: CreateCommandOptions) => {
      await createProject(projectName, options);
    });
};

const createProject = async (
  projectName: string,
  options: CreateCommandOptions,
) => {
  if (!validateProjectName(projectName)) {
    console.error(
      chalk.red(
        'Invalid project name. Use lowercase letters, numbers, and dashes.',
      ),
    );
    process.exit(1);
  }

  const projectPath = path.join(process.cwd(), projectName);
  ensureTargetDirectory(projectPath, options.force);

  const templateRepo = resolveTemplateRepo(options.template);
  console.log(chalk.blue(`Using template ${templateRepo}`));

  try {
    const latestTag = await fetchLatestReleaseTag(templateRepo);
    const templateUrl = `https://github.com/${templateRepo}/archive/refs/tags/${latestTag}.zip`;
    await downloadAndExtractTemplate(templateUrl, projectPath);

    const pmPreference = normalizePackageManager(options.pm);
    const detectedPm = detectPackageManager(projectPath);
    const packageManager = pmPreference || detectedPm;
    const configOverrides: Partial<ReturnType<typeof loadProjectConfig>> = {
      packageManager,
    };

    ensureProjectConfig(projectPath, configOverrides);
    const config = loadProjectConfig(projectPath);

    bootstrapEnvFile(projectPath, config.env.localExample, config.env.local, {
      quiet: true,
    });
    if (options.docker) {
      bootstrapEnvFile(
        projectPath,
        config.env.dockerExample,
        config.env.docker,
        { quiet: true },
      );
    }

    if (options.noInstall) {
      console.log(
        chalk.yellow('Skipping dependency installation (--no-install).'),
      );
    } else {
      console.log(
        chalk.blue(`Installing dependencies with ${packageManager}...`),
      );
      installDependencies(packageManager, projectPath);
    }

    logSuccessMessage(projectName, { docker: options.docker });

    if (options.dev) {
      if (options.noInstall) {
        console.log(
          chalk.yellow(
            'Dependencies were not installed. Run `npm install` before `--dev`.',
          ),
        );
      } else {
        console.log(chalk.blue('Starting dev server...'));
        await runDev({
          cwd: projectPath,
          docker: options.docker,
        });
      }
    }
  } catch (error) {
    console.error(chalk.red('Error creating project.'), error);
    process.exit(1);
  }
};
const resolveTemplateRepo = (template?: string) => {
  if (!template) {
    return DEFAULT_TEMPLATE_REPO;
  }

  if (template.includes('/')) {
    return template;
  }

  return `hexastack/hexabot-template-${template}`;
};
const ensureTargetDirectory = (projectPath: string, force?: boolean) => {
  if (fs.existsSync(projectPath)) {
    const isEmpty = fs.readdirSync(projectPath).length === 0;
    if (!isEmpty && !force) {
      console.error(
        chalk.red(
          `Directory ${projectPath} is not empty. Use --force to scaffold anyway.`,
        ),
      );
      process.exit(1);
    }
  } else {
    fs.mkdirSync(projectPath, { recursive: true });
  }
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
const logSuccessMessage = (
  projectName: string,
  options: { docker?: boolean },
) => {
  console.log('\n');
  console.log(chalk.green(`🎉 Project ${projectName} created successfully.`));
  console.log('\n');
  console.log(chalk.bgYellow.black(`Next steps:`));
  console.log(chalk.gray(`1. Navigate to the project folder:`));
  console.log(chalk.yellow(`   cd ${projectName}`));
  if (options.docker) {
    console.log(
      chalk.gray(
        `2. Run dev mode with Docker (or omit --docker for local sqlite):`,
      ),
    );
    console.log(chalk.yellow(`   hexabot dev --docker`));
  } else {
    console.log(chalk.gray(`2. Start local dev server (SQLite by default):`));
    console.log(chalk.yellow(`   hexabot dev`));
  }
  console.log(chalk.gray(`3. Explore docker helpers if needed:`));
  console.log(chalk.yellow(`   hexabot docker up --services postgres`));
  console.log(
    chalk.gray(
      `Need env files? Run ${chalk.white('hexabot env init --docker')}`,
    ),
  );
  console.log('\n');
};
