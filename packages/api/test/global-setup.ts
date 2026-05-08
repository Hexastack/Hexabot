/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import net from 'net';
import 'tsconfig-paths/register';

import { configureJestNetworkEnv, getJestHost } from '@/utils/test/port';

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: getJestHost(), port });
    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };
    const finish = (inUse: boolean) => {
      cleanup();
      resolve(inUse);
    };

    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', (err: NodeJS.ErrnoException) => {
      cleanup();
      // Some sandboxes deny loopback probes; the test listener will still
      // surface real bind failures.
      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'EPERM' ||
        err.code === 'EACCES'
      ) {
        resolve(false);
      } else {
        reject(err);
      }
    });
    socket.setTimeout(1000);
  });
}

export = async function globalSetup() {
  const { port } = configureJestNetworkEnv();
  const inUse = await isPortInUse(port);

  if (inUse) {
    throw new Error(
      `Jest port ${port} is already in use on ${getJestHost()}. Set JEST_PORT to an available port before executing Jest tests.`,
    );
  }
};
