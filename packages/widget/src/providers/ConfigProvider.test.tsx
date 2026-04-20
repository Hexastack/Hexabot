/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ConfigProvider, useConfig } from "./ConfigProvider";

const ConfigProbe = () => {
  const config = useConfig();

  return (
    <div
      data-config-probe="1"
      data-mode={config.mode ?? ""}
      data-primary={config.primaryColor ?? ""}
      data-transport={config.transport ?? ""}
    />
  );
};

describe("ConfigProvider", () => {
  let container: HTMLDivElement;
  let root: Root | undefined;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
      root = undefined;
    }
    container.remove();
  });

  it("updates context values when config props change", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(
        <ConfigProvider
          mode="light"
          primaryColor="#0074D9"
          transport="polling"
        >
          <ConfigProbe />
        </ConfigProvider>,
      );
    });

    let probeNode = container.querySelector("[data-config-probe='1']");

    expect(probeNode?.getAttribute("data-mode")).toBe("light");
    expect(probeNode?.getAttribute("data-primary")).toBe("#0074D9");
    expect(probeNode?.getAttribute("data-transport")).toBe("polling");

    await act(async () => {
      root?.render(
        <ConfigProvider mode="dark" primaryColor="#111827" transport="ws">
          <ConfigProbe />
        </ConfigProvider>,
      );
    });

    probeNode = container.querySelector("[data-config-probe='1']");

    expect(probeNode?.getAttribute("data-mode")).toBe("dark");
    expect(probeNode?.getAttribute("data-primary")).toBe("#111827");
    expect(probeNode?.getAttribute("data-transport")).toBe("ws");
  });
});
