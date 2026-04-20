/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { resolveSocketIoTransports } from "./SocketIoClient";

describe("resolveSocketIoTransports", () => {
  it("maps ws transport mode to websocket only", () => {
    expect(resolveSocketIoTransports("ws")).toEqual(["websocket"]);
  });

  it("maps polling transport mode to polling only", () => {
    expect(resolveSocketIoTransports("polling")).toEqual(["polling"]);
  });
});
