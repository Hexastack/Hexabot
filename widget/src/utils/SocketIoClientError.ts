/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { SocketIoClient } from "./SocketIoClient";

export class SocketIoClientError extends Error {
  /** HTTP-like status code suitable for client handling */
  public readonly statusCode: number;

  public readonly socket: SocketIoClient;

  constructor(
    socket: SocketIoClient,
    message: string,
    statusCode = 500,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = "SocketIoClientError";
    this.statusCode = statusCode;
    this.socket = socket;
    // Optional cause (Node 16+ supports Error.cause)
    if (options?.cause !== undefined) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.cause = options.cause;
    }

    // Fix prototype chain when targeting ES5
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, SocketIoClientError);
  }

  /** Handy for emitting over Socket.IO or logging as JSON */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      ...("cause" in this && this.cause !== undefined
        ? { cause: this.cause }
        : {}),
    };
  }
}
