import axios from 'axios';
import chalk from 'chalk';
import { execSync } from 'child_process';
import decompress from 'decompress'; // to unzip the downloaded files
import * as fs from 'fs';
import * as path from 'path';

/**
 * Check for pre-requisites
 */
export const checkPrerequisites = () => {
  // Check Docker
  try {
    const dockerVersion = execSync('docker --version', { encoding: 'utf-8' });
    console.log(chalk.green(`Docker is installed: ${dockerVersion.trim()}`));
  } catch (error) {
    console.error(chalk.red('Docker is not installed. Please install Docker.'));
    process.exit(1);
  }

  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version', {
      encoding: 'utf-8',
    }).trim();
    const requiredNodeVersion = '20.18.1';

    // Remove the 'v' prefix from the version string (e.g., 'v20.18.1' -> '20.18.1')
    const currentNodeVersion = nodeVersion.startsWith('v')
      ? nodeVersion.slice(1)
      : nodeVersion;

    if (compareVersions(currentNodeVersion, requiredNodeVersion) >= 0) {
      console.log(chalk.green(`Node.js version is sufficient: ${nodeVersion}`));
    } else {
      console.error(
        chalk.red(
          `Node.js version must be at least ${requiredNodeVersion}. Current version: ${nodeVersion}. Please install or upgrade Node.js.`,
        ),
      );
      process.exit(1);
    }
  } catch (error) {
    console.error(
      chalk.red(
        'Node.js is is not accessible or is not installed correctly. Please install Node.js version 20.18.1 or higher and ensure it is in your system\'s PATH.',
      ),
    );
    process.exit(1);
  }
};

/**
 * Helper function to compare semantic versions
 * @param current
 * @param required
 * @returns
 */
export const compareVersions = (current: string, required: string) => {
  const currentParts = current.split('.').map(Number);
  const requiredParts = required.split('.').map(Number);

  for (let i = 0; i < requiredParts.length; i++) {
    if (currentParts[i] > requiredParts[i]) {
      return 1;
    } else if (currentParts[i] < requiredParts[i]) {
      return -1;
    }
  }
  return 0;
};

/**
 * Check if the docker folder exists, otherwise prompt the user to cd into the correct folder.
 */
export const checkDockerFolder = (folder: string): void => {
  if (!fs.existsSync(folder)) {
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

/**
 * Generate Docker Compose file arguments based on provided services.
 * @param services List of services
 * @param type Optional type ('dev' | 'prod')
 * @returns String of Docker Compose file arguments
 */
export const generateComposeFiles = (
  folder: string,
  services: string[],
  type?: 'dev' | 'prod',
): string => {
  let files = [`-f ${path.join(folder, 'docker-compose.yml')}`];

  services.forEach((service) => {
    files.push(`-f ${path.join(folder, `docker-compose.${service}.yml`)}`);
    if (type) {
      const serviceTypeFile = path.join(
        folder,
        `docker-compose.${service}.${type}.yml`,
      );
      if (fs.existsSync(serviceTypeFile)) {
        files.push(`-f ${serviceTypeFile}`);
      }
    }
  });

  if (type) {
    const mainTypeFile = path.join(folder, `docker-compose.${type}.yml`);
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
export const dockerCompose = (args: string): void => {
  try {
    const cmd = `docker compose ${args}`;
    console.log(chalk.yellow(cmd));
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
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
export const dockerExec = (
  container: string,
  command: string,
  options?: string,
): void => {
  try {
    const cmd = `docker exec -it ${options} ${container} ${command}`;
    console.log(chalk.bgYellow(cmd));
    execSync(cmd, {
      stdio: 'inherit',
    });
  } catch (error) {
    console.error(chalk.red('Error executing Docker Exec command.'));
    process.exit(1);
  }
};

/**
 * Parse the comma-separated service list.
 * @param serviceString Comma-separated list of services
 * @returns Array of services
 */
export const parseServices = (serviceString: string): string[] => {
  return serviceString
    .split(',')
    .map((service) => service.trim())
    .filter((s) => s);
};

/**
 * Function to validate the project name
 *
 * @param projectName
 * @returns Valid or or not
 */
export const validateProjectName = (projectName: string) => {
  const regex = /^[a-z][a-z0-9\-]+$/;
  return regex.test(projectName);
};

/**
 * Function to download and extract the GitHub repository zip
 */
export const downloadAndExtractTemplate = async (
  templateUrl: string,
  destination: string,
): Promise<void> => {
  try {
    const response = await axios({
      url: templateUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    const zipFilePath = path.join(destination, 'template.zip');
    fs.writeFileSync(zipFilePath, response.data);

    // Extract the downloaded zip file
    await decompress(zipFilePath, destination, {
      strip: 1, // This removes the top-level directory (repository name)
    });
    fs.unlinkSync(zipFilePath); // Remove the zip file after extraction
  } catch (error) {
    throw new Error(`Failed to download template from GitHub`);
  }
};
