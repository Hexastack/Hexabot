/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { IOOutgoingMessage } from '../pipes/io-message.pipe';

export class SocketResponse {
  private statusCode: number = 200;

  private headers: { [key: string]: any } = {};

  private sendResponseHeaders: boolean;

  private sendStatusCode: boolean;

  private promise: Promise<any>;

  private resolve: (value?: any) => void;

  private reject: (reason?: any) => void;

  constructor(
    sendResponseHeaders: boolean = true,
    sendStatusCode: boolean = true,
  ) {
    this.sendResponseHeaders = sendResponseHeaders;
    this.sendStatusCode = sendStatusCode;
    this.promise = new Promise(this.init.bind(this));
  }

  private init = (resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  };

  status(code: number): SocketResponse {
    this.statusCode = code;
    return this;
  }

  set(key: string, value: any): SocketResponse {
    this.headers[key] = value;
    return this;
  }

  setHeaders(headers: { [key: string]: any }): SocketResponse {
    this.headers = headers;
    return this;
  }

  send(body: any) {
    const response: Partial<IOOutgoingMessage> = { body };

    if (this.sendResponseHeaders) {
      response.headers = { ...this.headers };
    }

    if (this.sendStatusCode) {
      response.statusCode = this.statusCode;
    }

    // @TODO : Would need to store the user session using sessionStore

    // this.socket.send(response);
    this.resolve(response);
    return response;
  }

  json<T = Partial<IOOutgoingMessage>>(data: T): T {
    this.set('Content-Type', 'application/json');
    return this.send(data) as T;
  }

  public getPromise() {
    return this.promise;
  }
}
