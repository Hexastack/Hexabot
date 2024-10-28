#!/usr/bin/env node
import chalk from 'chalk';
import { execSync } from 'child_process';
import { Command } from 'commander';
import figlet from 'figlet';
import * as fs from 'fs';
import * as path from 'path';
console.log(figlet.textSync('Hexabot'));
// Configuration
const FOLDER = path.resolve(process.cwd(), './docker');
/**
 * Check if the docker folder exists, otherwise prompt the user to cd into the correct folder.
 */
const checkDockerFolder = () => {
    if (!fs.existsSync(FOLDER)) {
        console.error(chalk.red(`Error: The 'docker' folder is not found in the current directory.`));
        console.error(chalk.yellow(`Please make sure you're in the Hexabot project directory and try again.`));
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
const generateComposeFiles = (services, type) => {
    let files = [`-f ${path.join(FOLDER, 'docker-compose.yml')}`];
    services.forEach((service) => {
        files.push(`-f ${path.join(FOLDER, `docker-compose.${service}.yml`)}`);
        if (type) {
            const serviceTypeFile = path.join(FOLDER, `docker-compose.${service}.${type}.yml`);
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
const dockerCompose = (args) => {
    try {
        execSync(`docker compose ${args}`, { stdio: 'inherit' });
    }
    catch (error) {
        console.error(chalk.red('Error executing Docker Compose command.'));
        process.exit(1);
    }
};
/**
 * Execute a Docker Exec command.
 * @param container Container for the docker exec command
 * @param options Additional options for the docker exec command
 * @param command Command to be executed within the container
 */
const dockerExec = (container, command, options) => {
    try {
        execSync(`docker exec -it ${options} ${container} ${command}`, {
            stdio: 'inherit',
        });
    }
    catch (error) {
        console.error(chalk.red('Error executing Docker Exec command.'));
        process.exit(1);
    }
};
/**
 * Parse the comma-separated service list.
 * @param serviceString Comma-separated list of services
 * @returns Array of services
 */
const parseServices = (serviceString) => {
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
    .command('init')
    .description('Initialize the environment by copying .env.example to .env')
    .action(() => {
    const envPath = path.join(FOLDER, '.env');
    const exampleEnvPath = path.join(FOLDER, '.env.example');
    if (fs.existsSync(envPath)) {
        console.log(chalk.yellow('.env file already exists.'));
    }
    else {
        fs.copyFileSync(exampleEnvPath, envPath);
        console.log(chalk.green('Copied .env.example to .env'));
    }
});
program
    .command('start')
    .description('Start specified services with Docker Compose')
    .option('--enable <services>', 'Comma-separated list of services to enable', '')
    .action((options) => {
    const services = parseServices(options.enable);
    const composeArgs = generateComposeFiles(services);
    dockerCompose(`${composeArgs} up -d`);
});
program
    .command('dev')
    .description('Start specified services in development mode with Docker Compose')
    .option('--enable <services>', 'Comma-separated list of services to enable', '')
    .action((options) => {
    const services = parseServices(options.enable);
    const composeArgs = generateComposeFiles(services, 'dev');
    dockerCompose(`${composeArgs} up --build -d`);
});
program
    .command('migrate [args...]')
    .description('Run database migrations')
    .action((args) => {
    const migrateArgs = args.join(' ');
    dockerExec('api', `npm run migrate ${migrateArgs}`, '--user $(id -u):$(id -g)');
});
program
    .command('start-prod')
    .description('Start specified services in production mode with Docker Compose')
    .option('--enable <services>', 'Comma-separated list of services to enable', '')
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
    .option('--enable <services>', 'Comma-separated list of services to destroy', '')
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
