/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import net from 'net';
import 'tsconfig-paths/register';

const API_PORT = 3000;
const isReservedPort = async (port: number) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.listen(port, () => {
      server.close();
      resolve(false);
    });
    server.on('error', resolve);
  });
export = async function globalSetup() {
  if (await isReservedPort(API_PORT)) {
    throw `Not available required port ${API_PORT}`;
  }
};
