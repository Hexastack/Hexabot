/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { jest } from '@jest/globals';
import { Command } from 'commander';

const ensureProjectConfig = jest.fn();
const loadProjectConfig = jest.fn();
const bootstrapEnvFile = jest.fn();
const upsertEnvVariables = jest.fn();
const detectPackageManager = jest.fn();
const installDependencies = jest.fn();
const normalizePackageManager = jest.fn();
const downloadAndExtractTemplate = jest.fn();
const validateProjectName = jest.fn();
const runDev = jest.fn();
const input = jest.fn();
const password = jest.fn();

jest.unstable_mockModule('../../core/config.js', () => ({
  ensureProjectConfig,
  loadProjectConfig,
}));

jest.unstable_mockModule('../../core/env.js', () => ({
  bootstrapEnvFile,
  upsertEnvVariables,
}));

jest.unstable_mockModule('../../core/package-manager.js', () => ({
  detectPackageManager,
  installDependencies,
  normalizePackageManager,
}));

jest.unstable_mockModule('../../services/templates.js', () => ({
  downloadAndExtractTemplate,
}));

jest.unstable_mockModule('../../utils/validation.js', () => ({
  validateProjectName,
}));

jest.unstable_mockModule('../dev.js', () => ({
  runDev,
}));

jest.unstable_mockModule('@inquirer/prompts', () => ({
  input,
  password,
}));

let registerCreateCommand: (program: Command) => void;

const initialCwd = process.cwd();
const initialStdinTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
const initialStdoutTTY = Object.getOwnPropertyDescriptor(
  process.stdout,
  'isTTY',
);
let tempDir: string;
let exitSpy: ReturnType<typeof jest.spyOn>;

const restoreTTY = () => {
  if (initialStdinTTY) {
    Object.defineProperty(process.stdin, 'isTTY', initialStdinTTY);
  } else {
    delete (process.stdin as { isTTY?: boolean }).isTTY;
  }

  if (initialStdoutTTY) {
    Object.defineProperty(process.stdout, 'isTTY', initialStdoutTTY);
  } else {
    delete (process.stdout as { isTTY?: boolean }).isTTY;
  }
};
const setTTY = (enabled: boolean) => {
  Object.defineProperty(process.stdin, 'isTTY', {
    configurable: true,
    value: enabled,
  });
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    value: enabled,
  });
};

beforeAll(async () => {
  ({ registerCreateCommand } = await import('../create.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexabot-create-'));
  process.chdir(tempDir);
  setTTY(true);

  validateProjectName.mockReturnValue(true);
  detectPackageManager.mockReturnValue('pnpm');
  bootstrapEnvFile.mockReturnValue(true);
  (normalizePackageManager as any).mockImplementation((value: unknown) => {
    return typeof value === 'string' ? value.toLowerCase() : undefined;
  });
  loadProjectConfig.mockReturnValue({
    packageManager: 'pnpm',
    env: {
      local: '.env',
      localExample: '.env.example',
      docker: '.env.docker',
      dockerExample: '.env.docker.example',
    },
  });
  (globalThis as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ tag_name: 'v1.0.0' }),
  }));
  exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
    throw new Error(`process.exit:${code ?? ''}`);
  });
});

afterEach(() => {
  process.chdir(initialCwd);
  fs.rmSync(tempDir, { recursive: true, force: true });
  restoreTTY();
  jest.restoreAllMocks();
});

describe('registerCreateCommand', () => {
  it('prompts admin credentials and persists create env values', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (input as any)
      .mockResolvedValueOnce('Anis')
      .mockResolvedValueOnce('Bot')
      .mockResolvedValueOnce('anis@example.com');
    (password as any)
      .mockResolvedValueOnce('Admin#123')
      .mockResolvedValueOnce('Admin#123');

    const program = new Command();
    registerCreateCommand(program);

    await program.parseAsync([
      'node',
      'test',
      'create',
      'anisbot',
      '--template',
      'marrouchi/hexabot-v3-template',
    ]);

    const [templateUrl, projectPath] = (downloadAndExtractTemplate as any).mock
      .calls[0];
    expect(templateUrl).toBe(
      'https://github.com/marrouchi/hexabot-v3-template/archive/refs/tags/v1.0.0.zip',
    );
    expect(projectPath.endsWith(`${path.sep}anisbot`)).toBe(true);
    expect(bootstrapEnvFile).toHaveBeenCalledWith(
      projectPath,
      '.env.example',
      '.env',
      { quiet: true },
    );
    expect(bootstrapEnvFile).toHaveBeenCalledWith(
      projectPath,
      '.env.docker.example',
      '.env.docker',
      { quiet: true },
    );
    expect(upsertEnvVariables).toHaveBeenCalledWith(projectPath, '.env', {
      SEED_ADMIN_FIRST_NAME: 'Anis',
      SEED_ADMIN_LAST_NAME: 'Bot',
      SEED_ADMIN_EMAIL: 'anis@example.com',
      SEED_ADMIN_PASSWORD: 'Admin#123',
    });
    expect(upsertEnvVariables).toHaveBeenCalledWith(
      projectPath,
      '.env.docker',
      {
        SEED_ADMIN_FIRST_NAME: 'Anis',
        SEED_ADMIN_LAST_NAME: 'Bot',
        SEED_ADMIN_EMAIL: 'anis@example.com',
        SEED_ADMIN_PASSWORD: 'Admin#123',
        COMPOSE_PROJECT_NAME: 'anisbot',
      },
    );
    expect(exitSpy).not.toHaveBeenCalled();
    expect(input).toHaveBeenCalledTimes(3);
    expect(input).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: 'First name:' }),
    );
    expect(input).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ message: 'Last name:' }),
    );
    expect(input).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ message: 'Email:' }),
    );
    expect(password).toHaveBeenCalledTimes(2);
    expect(password).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: 'Password:' }),
    );
    expect(password).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ message: 'Confirm password:' }),
    );
    expect(bootstrapEnvFile).toHaveBeenCalledTimes(2);
    expect(upsertEnvVariables).toHaveBeenCalledTimes(2);
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Admin account');
    expect(output).toContain(
      'These details will be used to create the first admin user during setup.',
    );
    expect(output).toContain(
      'You can update them later from the generated environment file before starting the app.',
    );
    expect(output).toContain('Optional: install Hexabot AI coding skills');
    expect(output).toContain(
      'Use these with AI coding agents to generate actions and workflows faster:',
    );
    expect(output).toContain(
      'After starting Hexabot, you can generate an MCP token from your profile and connect your favorite AI coding agent.',
    );
  });

  it('skips Docker env values when the Docker env file is unavailable', async () => {
    (bootstrapEnvFile as any).mockImplementation(
      (_projectRoot: string, _exampleFile: string, targetFile: string) =>
        targetFile === '.env',
    );
    (input as any)
      .mockResolvedValueOnce('Anis')
      .mockResolvedValueOnce('Bot')
      .mockResolvedValueOnce('anis@example.com');
    (password as any)
      .mockResolvedValueOnce('Admin#123')
      .mockResolvedValueOnce('Admin#123');

    const program = new Command();
    registerCreateCommand(program);

    await program.parseAsync(['node', 'test', 'create', 'anisbot']);

    const [, projectPath] = (downloadAndExtractTemplate as any).mock.calls[0];
    expect(bootstrapEnvFile).toHaveBeenCalledWith(
      projectPath,
      '.env.docker.example',
      '.env.docker',
      { quiet: true },
    );
    expect(upsertEnvVariables).toHaveBeenCalledTimes(1);
    expect(upsertEnvVariables).toHaveBeenCalledWith(projectPath, '.env', {
      SEED_ADMIN_FIRST_NAME: 'Anis',
      SEED_ADMIN_LAST_NAME: 'Bot',
      SEED_ADMIN_EMAIL: 'anis@example.com',
      SEED_ADMIN_PASSWORD: 'Admin#123',
    });
  });

  it('fails cleanly when create runs in a non-interactive terminal', async () => {
    setTTY(false);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const program = new Command();
    registerCreateCommand(program);

    await expect(
      program.parseAsync(['node', 'test', 'create', 'anisbot']),
    ).rejects.toThrow('process.exit:1');
    expect(errorSpy).toHaveBeenCalled();
    expect(input).not.toHaveBeenCalled();
    expect(password).not.toHaveBeenCalled();
    expect(upsertEnvVariables).not.toHaveBeenCalled();
  });
});
