/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useEffect, useRef } from "react";

interface SocketIOClientOptions {
  transports?: string[]; // e.g., ['websocket']
  upgrade?: boolean;
  auth?: Record<string, unknown>;
  [key: string]: unknown; // For other options
}

interface UseWorkerSocketOptions {
  url: string;
  options?: SocketIOClientOptions;
  onMessage?: (event: string, data: unknown) => void;
}

export function useWorkerSocket({
  url,
  options = {},
  onMessage,
}: UseWorkerSocketOptions) {
  const workerRef = useRef<Worker | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const workerCode = `
      let socket = null;
      const bc = new BroadcastChannel('socket_channel');
      self.onmessage = function(e) {
      console.log(e)
        const { type, payload } = e.data;

        if (type === 'connect') {
          importScripts('https://cdn.socket.io/4.7.2/socket.io.min.js');

          const opts = payload.options || {};
          socket = io(payload.url, opts);

          socket.onAny((event, data) => {
            bc.postMessage({ event, data });
          });

        } else if (type === 'emit') {
          socket?.emit(payload.event, payload.data);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const blobURL = URL.createObjectURL(blob);
    const worker = new Worker(blobURL);

    workerRef.current = worker;

    const bc = new BroadcastChannel("socket_channel");

    bcRef.current = bc;

    bc.onmessage = (event: MessageEvent) => {
      const { event: eventName, data } = event.data;

      onMessage?.(eventName, data);
    };

    // Force WebSocket transport
    const forcedOptions = {
      ...options,
      transports: ["websocket"],
      upgrade: false,
    };

    worker.postMessage({
      type: "connect",
      payload: {
        url,
        options: forcedOptions,
      },
    });

    return () => {
      worker.terminate();
      bc.close();
      URL.revokeObjectURL(blobURL);
    };
  }, [url, JSON.stringify(options)]);

  const emit = (event: string, data: unknown) => {
    workerRef.current?.postMessage({
      type: "emit",
      payload: { event, data },
    });
  };

  return { emit };
}
