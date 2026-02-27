/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type HandleProps } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";

import type { WorkflowPort } from "../types/workflow-node.types";

import {
  getWorkflowPortBorderRadius,
  getWorkflowPortDimensions,
  resolveWorkflowPortRule,
} from "./port-rules";

type getHandleConfigProps = Omit<HandleProps, "type"> & {
  type: "target" | "source";
};

export const getHandleConfig = (
  id: WorkflowPort,
  direction: ResizeControlDirection = "horizontal",
): getHandleConfigProps => {
  const rule = resolveWorkflowPortRule(id, direction);
  const horizontalRule = resolveWorkflowPortRule(id, "horizontal");

  return {
    id,
    type: rule.type,
    position: rule.position,
    style: {
      ...getWorkflowPortDimensions(id, rule.position, direction),
      ...getWorkflowPortBorderRadius(horizontalRule.position, direction),
      background: "#555",
      ...(rule.style || {}),
    },
  };
};
