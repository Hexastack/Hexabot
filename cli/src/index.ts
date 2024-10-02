#!/usr/bin/env node

import figlet from 'figlet';
import { Command } from 'commander';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

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
  return serviceString.split(',').map((service) => service.trim());
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

// Parse arguments
program.parse(process.argv);

// If no command is provided, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
