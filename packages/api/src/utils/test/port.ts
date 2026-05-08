/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

const DEFAULT_JEST_PORT = 3001;
const JEST_HOST = '127.0.0.1';
const parsePort = (value: string | undefined, envName: string): number => {
  if (!value) {
    return DEFAULT_JEST_PORT;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(
      `Invalid ${envName} "${value}". Expected a TCP port between 1 and 65535.`,
    );
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid ${envName} "${value}". Expected a TCP port between 1 and 65535.`,
    );
  }

  return port;
};

export const getJestPort = (): number =>
  parsePort(process.env.JEST_PORT, 'JEST_PORT');

export const getJestHost = (): string => JEST_HOST;

export const getJestBaseUrl = (): string =>
  `http://${getJestHost()}:${getJestPort()}`;

export const configureJestNetworkEnv = () => {
  const port = getJestPort();
  const baseUrl = `http://${getJestHost()}:${port}`;
  const apiOrigin = process.env.JEST_API_ORIGIN ?? `${baseUrl}/api`;

  process.env.PORT = `${port}`;
  process.env.API_ORIGIN = apiOrigin;

  return { port, baseUrl, apiOrigin };
};
