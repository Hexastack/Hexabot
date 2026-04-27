/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as Icons from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  getWorkflowStateConfig,
  resolveWorkflowStepTheme,
} from "./workflow-theme.utils";

type IconProbeResult = { props: { className?: string } };

describe("workflow-theme.utils", () => {
  it("returns running state config with an animated icon", () => {
    const runningConfig = getWorkflowStateConfig("running");

    expect(runningConfig?.color).toBeUndefined();
    const runningIcon = runningConfig?.icon as
      | ((props: { className?: string; size?: number }) => IconProbeResult)
      | undefined;
    const iconElement = runningIcon?.({
      className: "existing",
      size: 16,
    });

    expect(iconElement?.props.className).toContain("workflow-icon-spin");
    expect(iconElement?.props.className).toContain("existing");
  });

  it("preserves node colors while running", () => {
    const resolved = resolveWorkflowStepTheme({
      action: { name: "send_message", color: "#336699" },
      status: "running",
      mode: "light",
    });

    expect(resolved.iconColor).toBe("#336699");
    expect(resolved.borderColor).toBe("#336699");
    expect(resolved.bgColor).toContain("#ffffff 95%");
  });

  it("preserves node colors while suspended", () => {
    const resolved = resolveWorkflowStepTheme({
      action: { name: "send_message", color: "#336699" },
      status: "suspended",
      mode: "light",
    });

    expect(resolved.iconColor).toBe("#336699");
    expect(resolved.borderColor).toBe("#336699");
    expect(resolved.bgColor).toContain("#ffffff 95%");
  });

  it("uses action accent colors when no state override is present", () => {
    const resolved = resolveWorkflowStepTheme({
      action: { name: "send_message", color: "#336699" },
      mode: "light",
    });

    expect(resolved.iconColor).toBe("#336699");
    expect(resolved.borderColor).toBe("#336699");
    expect(resolved.bgColor).toContain("#ffffff 95%");
  });

  it("adapts mixed background color for dark mode", () => {
    const resolved = resolveWorkflowStepTheme({
      action: { name: "send_message", color: "#336699" },
      mode: "dark",
    });

    expect(resolved.bgColor).toContain("#000000 85%");
  });

  it("uses white text color fallback in dark mode", () => {
    const resolved = resolveWorkflowStepTheme({
      mode: "dark",
    });

    expect(resolved.color).toBe("#ffffff");
  });

  it("keeps base theme values when provided", () => {
    const resolved = resolveWorkflowStepTheme({
      baseTheme: {
        Icon: Icons.Brain,
        color: "#123123",
        bgColor: "#fafafa",
        iconColor: "#456456",
        borderColor: "#789789",
      },
    });

    expect(resolved.Icon).toBe(Icons.Brain);
    expect(resolved.color).toBe("#123123");
    expect(resolved.bgColor).toBe("#fafafa");
    expect(resolved.iconColor).toBe("#456456");
    expect(resolved.borderColor).toBe("#789789");
  });

  it("resolves base theme lucide icon names before action icons", () => {
    const resolved = resolveWorkflowStepTheme({
      baseTheme: {
        icon: "Database",
      },
      action: {
        name: "send_message",
        icon: "Brain",
      },
    });

    expect(resolved.Icon).toBe(Icons.Database);
  });

  it("prioritizes execution state theme over base and action colors", () => {
    const failedConfig = getWorkflowStateConfig("failed");
    const resolved = resolveWorkflowStepTheme({
      baseTheme: {
        Icon: Icons.Bot,
        borderColor: "#111111",
      },
      action: {
        name: "send_message",
        icon: "Brain",
        color: "#222222",
      },
      status: "failed",
    });

    expect(resolved.Icon).toBe(failedConfig?.icon);
    expect(resolved.iconColor).toBe("#FF0000");
    expect(resolved.borderColor).toBe("#FF0000");
  });
});
