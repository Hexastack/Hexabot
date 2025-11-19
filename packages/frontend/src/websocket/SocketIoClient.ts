/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client";

import { IOIncomingMessage, IOOutgoingMessage } from "./types/io-message";

type SocketIoClientConfig = Partial<ManagerOptions & SocketOptions>;

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

  private initialized: boolean = false;

  constructor(apiUrl: string, socketConfig?: SocketIoClientConfig) {
    this.config = {
      ...SocketIoClient.defaultConfig,
      ...socketConfig,
      autoConnect: false,
    };
    const url = new URL(apiUrl);

    this.socket = io(url.origin, this.config);
  }

  /**
   * Initializes the socket client and sets up event handlers.
   * @param handlers Event handlers for connection, disconnection, and connection errors
   */
  public init({
    onConnect,
    onDisconnect,
    onConnectError,
  }: {
    onConnect?: () => void;
    onDisconnect?: (reason: string, details: any) => void;
    onConnectError?: (error: Error) => void;
  }) {
    if (!this.initialized) this.socket.connect();
    onConnect && this.uniqueOn("connect", onConnect);
    onDisconnect && this.uniqueOn("disconnect", onDisconnect);
    onConnectError && this.uniqueOn("connect_error", onConnectError);
    this.initialized = true;
  }

  /**
   * Registers an event handler for the specified event and removes any existing handlers.
   * @param event The event name
   * @param callback The callback function to handle the event
   */
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
    const response: IOIncomingMessage = await this.socket.emitWithAck(
      options.method,
      options,
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response;
    }
    throw new Error(
      `Request failed with status code ${response.statusCode}: ${JSON.stringify(
        response.body,
      )}`,
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
    options?: Partial<Omit<IOOutgoingMessage, "url" | "method" | "data">>,
  ): Promise<IOIncomingMessage<T>> {
    return await this.request({
      method: "get",
      url,
      ...options,
    });
  }
}
