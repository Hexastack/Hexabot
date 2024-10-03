#!/usr/bin/env node

import figlet from 'figlet';
import { Command } from 'commander';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import degit from 'degit';

console.log(figlet.textSync('Hexabot'));

// Configuration
const FOLDER = path.resolve(process.cwd(), './docker');

/**
 * Check if the docker folder exists, otherwise prompt the user to cd into the correct folder.
 */
const checkDockerFolder = (): void => {
  if (!fs.existsSync(FOLDER)) {
    console.error(
      chalk.red(
        `Error: The 'docker' folder is not found in the current directory.`,
      ),
    );
    console.error(
      chalk.yellow(
        `Please make sure you're in the Hexabot project directory and try again.`,
      ),
    );
    console.log(chalk.cyan(`Example: cd path/to/hexabot`));
    process.exit(1); // Exit the script if the folder is not found
  }
};

// Initialize Commander
const program = new Command();

// Helper Functions

/**
 * Generate Docker Compose file arguments based on provided services.
 * @param services List of services
 * @param type Optional type ('dev' | 'prod')
 * @returns String of Docker Compose file arguments
 */
const generateComposeFiles = (
  services: string[],
  type?: 'dev' | 'prod',
): string => {
  let files = [`-f ${path.join(FOLDER, 'docker-compose.yml')}`];

  services.forEach((service) => {
    files.push(`-f ${path.join(FOLDER, `docker-compose.${service}.yml`)}`);
    if (type) {
      const serviceTypeFile = path.join(
        FOLDER,
        `docker-compose.${service}.${type}.yml`,
      );
      if (fs.existsSync(serviceTypeFile)) {
        files.push(`-f ${serviceTypeFile}`);
      }
    }
  });

  if (type) {
    const mainTypeFile = path.join(FOLDER, `docker-compose.${type}.yml`);
    if (fs.existsSync(mainTypeFile)) {
      files.push(`-f ${mainTypeFile}`);
    }
  }

  return files.join(' ');
};

/**
 * Execute a Docker Compose command.
 * @param args Additional arguments for the docker compose command
 */
const dockerCompose = (args: string): void => {
  try {
    execSync(`docker compose ${args}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('Error executing Docker Compose command.'));
    process.exit(1);
  }
};

/**
 * Parse the comma-separated service list.
 * @param serviceString Comma-separated list of services
 * @returns Array of services
 */
const parseServices = (serviceString: string): string[] => {
  return serviceString
    .split(',')
    .map((service) => service.trim())
    .filter((s) => s);
};

// Check if the docker folder exists
checkDockerFolder();

// Commands

program
  .name('Hexabot')
  .description('A CLI to manage your Hexabot chatbot instance')
  .version('1.0.0');

program
  .command('start')
  .description('Start specified services with Docker Compose')
  .option(
    '--enable <services>',
    'Comma-separated list of services to enable',
    '',
  )
  .action((options) => {
    const services = parseServices(options.enable);
    const composeArgs = generateComposeFiles(services);
    dockerCompose(`${composeArgs} up -d`);
  });

program
  .command('dev')
  .description(
    'Start specified services in development mode with Docker Compose',
  )
  .option(
    '--enable <services>',
    'Comma-separated list of services to enable',
    '',
  )
  .action((options) => {
    const services = parseServices(options.enable);
    const composeArgs = generateComposeFiles(services, 'dev');
    dockerCompose(`${composeArgs} up --build -d`);
  });

program
  .command('start-prod')
  .description(
    'Start specified services in production mode with Docker Compose',
  )
  .option(
    '--enable <services>',
    'Comma-separated list of services to enable',
    '',
  )
  .action((options) => {
    const services = parseServices(options.enable);
    const composeArgs = generateComposeFiles(services, 'prod');
    dockerCompose(`${composeArgs} up -d`);
  });

program
  .command('stop')
  .description('Stop specified Docker Compose services')
  .option('--enable <services>', 'Comma-separated list of services to stop', '')
  .action((options) => {
    const services = parseServices(options.enable);
    const composeArgs = generateComposeFiles(services);
    dockerCompose(`${composeArgs} down`);
  });

program
  .command('destroy')
  .description('Destroy specified Docker Compose services and remove volumes')
  .option(
    '--enable <services>',
    'Comma-separated list of services to destroy',
    '',
  )
  .action((options) => {
    const services = parseServices(options.enable);
    const composeArgs = generateComposeFiles(services);
    dockerCompose(`${composeArgs} down -v`);
  });

// Add install command to install extensions (e.g., channels, plugins)
program
  .command('install')
  .description('Install an extension for Hexabot')
  .argument('<type>', 'The type of extension (e.g., channel, plugin)')
  .argument(
    '<repository>',
    'GitHub repository for the extension (user/repo format)',
  )
  .action(async (type, repository) => {
    // Define the target folder based on the extension type
    let targetFolder = '';
    switch (type) {
      case 'channel':
        targetFolder = 'api/src/extensions/channels/';
        break;
      case 'plugin':
        targetFolder = 'api/src/extensions/plugins/';
        break;
      default:
        console.error(chalk.red(`Unknown extension type: ${type}`));
        process.exit(1);
    }

    // Get the last part of the repository name
    const repoName = repository.split('/').pop();

    // If the repo name starts with "hexabot-<TYPE>-", remove that prefix
    const extensionName = repoName.startsWith(`hexabot-${type}-`)
      ? repoName.replace(`hexabot-${type}-`, '')
      : repoName;

    const extensionPath = path.resolve(
      process.cwd(),
      targetFolder,
      extensionName,
    );

    // Check if the extension folder already exists
    if (fs.existsSync(extensionPath)) {
      console.error(
        chalk.red(`Error: Extension already exists at ${extensionPath}`),
      );
      process.exit(1);
    }

    try {
      console.log(
        chalk.cyan(`Fetching ${repository} into ${extensionPath}...`),
      );

      // Use degit to fetch the repository without .git history
      const emitter = degit(repository);
      await emitter.clone(extensionPath);

      console.log(chalk.cyan('Running npm install in the api/ folder...'));
      // Run npm install in the api folder to install dependencies
      execSync('npm install', {
        cwd: path.resolve(process.cwd(), 'api'),
        stdio: 'inherit',
      });

      console.log(
        chalk.green(`Successfully installed ${extensionName} as a ${type}.`),
      );
    } catch (error) {
      console.error(chalk.red('Error during installation:'), error);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// If no command is provided, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
