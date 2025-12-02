/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import net from 'net';
import 'tsconfig-paths/register';

const API_PORT = Number(process.env.API_PORT ?? 3000);

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    const onError = (err: NodeJS.ErrnoException) => {
      // Typical “port already in use”
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        reject(err);
      }
    };
    const onListen = () => {
      server.close(() => resolve(false));
    };

    server.once('error', onError);
    server.once('listening', onListen);

    server.unref();
    server.listen(port);
  });
}

export = async function globalSetup() {
  const inUse = await isPortInUse(API_PORT);

  if (inUse) {
    throw new Error(
      `Port ${API_PORT} is already in use. Please stop the running service before executing Jest tests.`,
    );
  }
};
