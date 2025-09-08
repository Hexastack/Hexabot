/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client";

import { Config } from "../types/config.types";
import {
  IOIncomingMessage,
  IOOutgoingMessage,
} from "../types/io-message.types";

import { SocketIoClientError } from "./SocketIoClientError";

type SocketIoClientConfig = Partial<ManagerOptions & SocketOptions>;

type SocketIoEventHandlers = {
  onConnect?: () => void;
  onDisconnect?: (reason: string, details: unknown) => void;
  onConnectError?: (error: Error) => void;
};

export class SocketIoClient {
  /**
   * Default configuration for the socket client
   * @static
   */
  static defaultConfig: SocketIoClientConfig = {
    // Socket options
    // auth: undefined,

    // Manager options
    autoConnect: true,
    // parser: undefined,
    randomizationFactor: 0.5,
    reconnection: true,
    reconnectionAttempts: 100,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    retries: 0,
    ackTimeout: 15_000,

    // Low Level Options
    addTrailingSlash: true, // eg: https://domain.path/ => https://domain.path/
    // autoUnref:false, //  firefox only option
    // path: "/socket.io", // This is the socket path in the server, leave it as default unless changed manually in server
    transports: ["websocket", "polling"], // ["websocket","polling", "websocket"]
    upgrade: true,
    withCredentials: true,
  };

  private socket: Socket;

  private config: SocketIoClientConfig;

  constructor(
    apiUrl: string,
    socketConfig: SocketIoClientConfig,
    handlers: SocketIoEventHandlers,
  ) {
    this.config = {
      ...SocketIoClient.defaultConfig,
      ...socketConfig,
      autoConnect: false,
    };
    const url = new URL(apiUrl);

    this.socket = io(url.origin, this.config);
    this.init(handlers);
  }

  get io() {
    return this.socket.io;
  }

  /**
   * Initializes the socket client and sets up event handlers.
   * @param handlers Event handlers for connection, disconnection, and connection errors
   */
  public init({
    onConnect,
    onDisconnect,
    onConnectError,
  }: SocketIoEventHandlers) {
    onConnect && this.uniqueOn("connect", onConnect);
    onDisconnect && this.uniqueOn("disconnect", onDisconnect);
    onConnectError && this.uniqueOn("connect_error", onConnectError);
  }

  /**
   * Registers an event handler for the specified event and removes any existing handlers.
   * @param event The event name
   * @param callback The callback function to handle the event
   */
  //TODO: Fix any type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uniqueOn(event: string, callback: (...args: any) => void) {
    this.socket.off(event);
    this.socket.on(event, callback);
  }

  /**
   * Disconnects the socket client.
   */
  public disconnect() {
    this.socket.disconnect();
  }

  /**
   * Connects the socket client.
   */
  public connect() {
    if (!this.socket.active) this.socket.connect();
  }

  /**
   * Waits for disconnection of the socket client.
   */
  public waitForDisconnect() {
    return new Promise<void>((resolve) => {
      this.socket.once("disconnect", () => resolve());

      this.socket.disconnect();
    });
  }

  /**
   * Reconnects the socket client using mutex across tabs.
   */
  public async forceReconnect(timeoutMs = 10_000) {
    const run = async () => {
      const socket = this.socket;

      if (!socket) {
        throw new Error("socket not initialized");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let timer: any;
      const off: Array<() => void> = [];

      try {
        await new Promise<void>((resolve, reject) => {
          timer = setTimeout(
            () => reject(new Error("reconnect timeout")),
            timeoutMs,
          );

          const onConnect = () => {
            resolve();
          };
          const onErr = (e: unknown) => {
            reject(e);
          };

          socket.once("connect", onConnect);
          socket.once("connect_error", onErr);

          off.push(
            () => socket.off("connect", onConnect),
            () => socket.off("connect_error", onErr),
          );

          // Force a fresh handshake if we were connected or mid-attempt
          if (socket.connected) {
            this.waitForDisconnect()
              .then(() => {
                socket.connect();
              })
              .catch(reject);
          } else {
            socket.connect();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(err);
      } finally {
        clearTimeout(timer);
        off.forEach((fn) => fn());
      }
    };
    const locks = navigator.locks;

    if (locks?.request) {
      // Keep it exclusive but guaranteed to release via timeout/error handling
      await locks.request("ws_connection", { mode: "exclusive" }, run);
    } else {
      // Fallback when Web Locks isn’t supported
      await run();
    }
  }

  /**
   * Registers an event handler for the specified event.
   * @param event The event name
   * @param callback The callback function to handle the event
   */
  public on<T>(event: string, callback: (data: T) => void) {
    this.socket.on(event, callback);
  }

  /**
   * Removes an event handler for the specified event.
   * @param event The event name
   * @param callback The callback function to remove
   */
  //TODO: Fix any type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public off(event: string, callback: (...args: any) => void) {
    this.socket.off(event, callback);
  }

  /**
   * Sends a request to the server and waits for an acknowledgment.
   * @param options The request options including URL and method
   * @returns The response from the server
   * @throws Error if the request fails
   */
  public async request<T>(
    options: Pick<IOOutgoingMessage, "url" | "method"> &
      Partial<IOOutgoingMessage>,
  ): Promise<IOIncomingMessage<T>> {
    const response: IOIncomingMessage<T> = await this.socket.emitWithAck(
      options.method,
      options,
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response;
    }

    throw new SocketIoClientError(
      this,
      JSON.stringify(response.body),
      response.statusCode,
    );
  }

  /**
   * Sends a GET request to the server.
   * @param url The URL to send the request to
   * @param options Optional request options
   * @returns The response from the server
   */
  public async get<T>(
    url: string,
    options?: Partial<Omit<IOOutgoingMessage, "url" | "method" | "body">>,
  ): Promise<IOIncomingMessage<T>> {
    return await this.request({
      method: "get",
      url,
      ...options,
    });
  }

  public async post<T>(
    url: string,
    options: Partial<Omit<IOOutgoingMessage, "url" | "method">>,
  ): Promise<IOIncomingMessage<T>> {
    return await this.request({
      method: "post",
      url,
      ...options,
    });
  }
}

let socketIoClient: SocketIoClient;

/**
 * Returns a singleton instance of the socket io client
 *
 * @param config The socket connection config
 * @param handlers Event handlers
 * @returns Socket io client instance
 */
export const getSocketIoClient = (
  config: Config,
  handlers: SocketIoEventHandlers,
) => {
  if (!socketIoClient) {
    socketIoClient = new SocketIoClient(
      config.apiUrl,
      {
        query: {
          channel: config.channel,
        },
      },
      handlers,
    );
  }

  return socketIoClient;
};
