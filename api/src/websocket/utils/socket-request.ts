/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

// Import required modules and configurations

import { Socket } from 'socket.io';

import { config } from '@/config';
import { User } from '@/user/schemas/user.schema';

import { IOIncomingMessage } from '../pipes/io-message.pipe';

// Define the SocketRequest class for managing incoming socket requests
export class SocketRequest {
  // Default properties related to the connection type and protocols
  transport: string = 'socket.io';

  protocol: string = 'ws';

  isSocket: boolean = true;

  // Networking properties
  ip: string;

  ips: string[];

  port: number | null = null;

  // Socket and URL data
  socket: Socket;

  url: string;

  path: string;

  query: Record<string, any>;

  // Request specifics
  method: string;

  body: Record<string, any>;

  headers: {
    host?: string;
    cookie?: string;
    nosession?: boolean;
    origin?: string;
    ['user-agent']?: string;
    [key: string]: string | boolean | undefined;
  };

  get session() {
    return this.socket.request.session;
  }

  // User information
  user: User;

  // Constructor to initialize a new socket request
  constructor(
    socket: Socket,
    method: string,
    incomingMessage: IOIncomingMessage,
  ) {
    // Set IP and possible IPs list from the socket handshake information
    this.ip = socket.handshake?.address || '';
    this.ips =
      socket.handshake && 'ips' in socket.handshake
        ? (socket.handshake.ips as string[])
        : [this.ip];

    // Reference to the socket and the URL from the incoming message
    this.socket = socket;
    this.url = incomingMessage.url;

    // Resolve the URL and path
    const urlObj = new URL(
      this.url.startsWith('http')
        ? this.url
        : `${config.apiBaseUrl}${this.url}`,
    );
    this.path = urlObj.pathname || '/';

    // Combine query parameters from URL and socket handshake
    const urlQuery = Array.from(urlObj.searchParams).reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, any>,
    );
    this.query = {
      ...socket.handshake.query,
      ...urlQuery,
    };

    // Set the HTTP method and the body of the request
    this.method = method.toUpperCase();
    this.body = Array.isArray(incomingMessage.data)
      ? incomingMessage.data
      : { ...(incomingMessage.params || {}), ...(incomingMessage.data || {}) };

    // Configure headers using both the socket's handshake headers and the incoming message's headers
    this.headers = {
      host: urlObj.host,
      cookie: socket.handshake.headers.cookie || undefined,
      nosession: socket.handshake.headers.nosession ? true : undefined,
      origin: socket.handshake.headers.origin || undefined,
      ...incomingMessage.headers,
    };
  }
}
