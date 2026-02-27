/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";

import { ELinkType } from "../types/workflow-node.types";

import { getHandleConfig } from "./handle.utils";
import {
  getAgentOutHandleMeta,
  getConditionalOperatorOutHandleMeta,
  resolveWorkflowPortRule,
} from "./port-rules";

describe("handle.utils", () => {
  it("parses conditional operator out handle metadata", () => {
    expect(getConditionalOperatorOutHandleMeta("operatorOut-1-3")).toEqual({
      index: 1,
      total: 3,
    });
    expect(getConditionalOperatorOutHandleMeta("operatorOut-4-3")).toBeUndefined();
    expect(getConditionalOperatorOutHandleMeta("operatorOut-x-y")).toBeUndefined();
  });

  it("parses agent attachment handle metadata", () => {
    expect(getAgentOutHandleMeta(ELinkType.AGENT_MODEL)).toEqual({
      handleId: ELinkType.AGENT_MODEL,
      horizontal: 10,
      vertical: 30,
    });
    expect(getAgentOutHandleMeta(ELinkType.TASK_OUT)).toBeUndefined();
  });

  it("resolves handle config for conditional out handles", () => {
    const config = getHandleConfig("operatorOut-1-3", "horizontal");

    expect(config.type).toBe("source");
    expect(config.position).toBe(Position.Right);
    expect(config.style?.top).toBe("50%");
  });

  it("resolves attachment handle positions for horizontal and vertical directions", () => {
    const horizontal = getHandleConfig(ELinkType.AGENT_TOOL, "horizontal");
    const vertical = getHandleConfig(ELinkType.AGENT_TOOL, "vertical");

    expect(horizontal.position).toBe(Position.Bottom);
    expect(horizontal.style?.left).toBe("90%");
    expect(vertical.position).toBe(Position.Left);
    expect(vertical.style?.top).toBe("70%");
  });

  it("keeps port resolution consistent for render and layout rules", () => {
    const rule = resolveWorkflowPortRule(ELinkType.TOOL_IN, "horizontal");
    const handle = getHandleConfig(ELinkType.TOOL_IN, "horizontal");

    expect(rule.type).toBe(handle.type);
    expect(rule.position).toBe(handle.position);
    expect(rule.position).toBe(Position.Top);
  });
});
