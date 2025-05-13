/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import util from 'util';

import type { ServerOptions } from 'socket.io';

import { AppInstance } from '@/app.instance';
import { config } from '@/config';
import { SettingService } from '@/setting/services/setting.service';

export const buildWebSocketGatewayOptions = (): Partial<ServerOptions> => {
  const opts: Partial<ServerOptions> = {
    allowEIO3: true, // Allows support for Engine.io v3 clients.
    path: config.sockets.path,
    ...(typeof config.sockets.serveClient !== 'undefined' && {
      serveClient: config.sockets.serveClient,
    }),
    ...(config.sockets.beforeConnect && {
      allowRequest: (handshake, cb) => {
        try {
          const result = config.sockets.beforeConnect(handshake);
          return cb(null, result);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(
            `A socket was rejected via the config.sockets.beforeConnect function.\n` +
              `It attempted to connect with headers:\n` +
              `${util.inspect(handshake.headers, { depth: null })}\n` +
              `Details: ${e}`,
          );
          return cb(e, false);
        }
      },
    }),
    ...(config.sockets.pingTimeout && {
      pingTimeout: config.sockets.pingTimeout,
    }),
    ...(config.sockets.pingInterval && {
      pingInterval: config.sockets.pingInterval,
    }),
    ...(config.sockets.maxHttpBufferSize && {
      maxHttpBufferSize: config.sockets.maxHttpBufferSize,
    }),
    ...(config.sockets.transports && { transports: config.sockets.transports }),
    ...(config.sockets.allowUpgrades && {
      allowUpgrades: config.sockets.allowUpgrades,
    }),
    ...(config.sockets.cookie && { cookie: config.sockets.cookie }),
    cors: {
      origin: async (origin, cb) => {
        if (config.env === 'test') {
          cb(null, true);
        } else {
          // Retrieve the allowed origins from the settings
          const app = AppInstance.getApp();
          const settingService = app.get<SettingService>(SettingService);

          await settingService
            .getAllowedOrigins()
            .then((allowedOrigins) => {
              if (origin && allowedOrigins.includes(origin)) {
                cb(null, true);
              } else {
                // eslint-disable-next-line no-console
                console.log(
                  `A socket was rejected via the config.sockets.onlyAllowOrigins array.\n` +
                    `It attempted to connect with origin: ${origin}`,
                );
                cb(new Error('Origin not allowed'), false);
              }
            })
            .catch(cb);
        }
      },
    },
  };

  return opts;
};
