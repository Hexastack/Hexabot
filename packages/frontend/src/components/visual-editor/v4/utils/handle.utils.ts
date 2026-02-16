/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type HandleProps, Position } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import { merge } from "lodash";

import {
  EHandleType,
  ELinkType,
  type WorkflowPort,
} from "../types/workflow-node.types";

type getHandleConfigProps = Omit<HandleProps, "type"> & { type: EHandleType };

const CONDITIONAL_OPERATOR_OUT_PATTERN = /^operatorOut-(\d+)-(\d+)$/;

export const getConditionalOperatorOutHandleMeta = (
  id: WorkflowPort | string,
) => {
  const match = String(id).match(CONDITIONAL_OPERATOR_OUT_PATTERN);

  if (!match) {
    return;
  }

  const index = Number(match[1]);
  const total = Number(match[2]);

  if (
    !Number.isInteger(index) ||
    !Number.isInteger(total) ||
    index < 0 ||
    total < 1 ||
    index >= total
  ) {
    return;
  }

  return { index, total } as const;
};

const getHandleBaseId = (id: WorkflowPort): ELinkType => {
  return getConditionalOperatorOutHandleMeta(id)
    ? ELinkType.OPERATOR_OUT
    : (id as ELinkType);
};
const getConditionalOperatorOutStyle = (
  id: WorkflowPort,
  direction: ResizeControlDirection,
) => {
  const meta = getConditionalOperatorOutHandleMeta(id);

  if (!meta) {
    return;
  }

  const progress = ((meta.index + 1) / (meta.total + 1)) * 100;

  return direction === "horizontal"
    ? { top: `${progress}%` }
    : { left: `${progress}%` };
};
const getHandleDimensions = (
  id: WorkflowPort,
  position: Position,
  direction: ResizeControlDirection,
) => {
  const baseId = getHandleBaseId(id);
  const isHorizontalLeftRight =
    direction === "horizontal" &&
    [Position.Left, Position.Right].includes(position);
  const isVerticalTopBottom =
    direction === "vertical" &&
    [Position.Top, Position.Bottom].includes(position);

  if (isHorizontalLeftRight) {
    return {
      width: "10px",
      height: "15px",
    };
  } else if (isVerticalTopBottom) {
    return { width: "15px", height: "10px" };
  } else if (
    [ELinkType.TOOL_IN, ELinkType.MODEL_IN, ELinkType.MEMORY_IN].includes(
      baseId,
    )
  ) {
    return direction === "horizontal"
      ? { width: "15px", height: "10px" }
      : {
          width: "10px",
          height: "15px",
        };
  } else if (
    [
      ELinkType.AGENT_TOOL,
      ELinkType.AGENT_MODEL,
      ELinkType.AGENT_MEMORY,
    ].includes(baseId)
  ) {
    return direction === "horizontal"
      ? { width: "15px", height: "10px" }
      : {
          width: "10px",
          height: "15px",
        };
  }
};
const getBorderRadius = (
  position: Position,
  direction: ResizeControlDirection,
) => {
  const radiusMap = {
    [Position.Left]: {
      horizontal: { borderTopRightRadius: "0", borderBottomRightRadius: "0" },
      vertical: { borderBottomLeftRadius: "0", borderBottomRightRadius: "0" },
    },
    [Position.Right]: {
      horizontal: { borderTopLeftRadius: "0", borderBottomLeftRadius: "0" },
      vertical: { borderTopLeftRadius: "0", borderTopRightRadius: "0" },
    },
    [Position.Bottom]: {
      horizontal: { borderTopLeftRadius: "0", borderTopRightRadius: "0" },
      vertical: { borderBottomRightRadius: "0", borderTopRightRadius: "0" },
    },
    [Position.Top]: {
      horizontal: { borderBottomLeftRadius: "0", borderBottomRightRadius: "0" },
      vertical: { borderTopLeftRadius: "0", borderBottomLeftRadius: "0" },
    },
  };

  return radiusMap[position][direction];
};
const getConfig = (
  id: WorkflowPort,
  direction: ResizeControlDirection,
): getHandleConfigProps => {
  const baseId = getHandleBaseId(id);
  const conditionalOperatorOutStyle = getConditionalOperatorOutStyle(
    id,
    direction,
  );

  switch (baseId) {
    case ELinkType.GROUP_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
      };
    case ELinkType.GROUP_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
      };
    case ELinkType.INDICATOR_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
      };
    case ELinkType.INDICATOR_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
      };
    case ELinkType.OPERATOR_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
      };
    case ELinkType.OPERATOR_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        style: conditionalOperatorOutStyle,
      };
    case ELinkType.TASK_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style: {
          ...(direction === "horizontal" ? {} : {}),
        },
      };
    case ELinkType.TASK_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        style: {
          ...(direction === "horizontal" ? {} : {}),
        },
      };
    case ELinkType.TASK_TOOL:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Bottom : Position.Left,
      };
    case ELinkType.AGENT_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style: {
          ...(direction === "horizontal" ? { top: "50%" } : {}),
        },
      };
    case ELinkType.AGENT_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        style: {
          ...(direction === "horizontal" ? { top: "50%" } : {}),
        },
      };

    case ELinkType.AGENT_MODEL:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Bottom : Position.Left,
        style: {
          ...(direction === "horizontal" ? { left: "10%" } : { top: "30%" }),
        },
      };
    case ELinkType.AGENT_MEMORY:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Bottom : Position.Left,
        style: {
          ...(direction === "horizontal" ? { left: "50%" } : { top: "50%" }),
        },
      };
    case ELinkType.AGENT_TOOL:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Bottom : Position.Left,
        style: {
          ...(direction === "horizontal" ? { left: "90%" } : { top: "70%" }),
        },
      };
    case ELinkType.TOOL_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Top : Position.Right,
        style: {
          ...(direction === "horizontal"
            ? {
                left: "50%",
              }
            : {}),
        },
      };
    case ELinkType.MODEL_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Top : Position.Right,
        style: {
          ...(direction === "horizontal"
            ? {
                left: "50%",
              }
            : {}),
        },
      };
    case ELinkType.MEMORY_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Top : Position.Right,
        style: {
          ...(direction === "horizontal"
            ? {
                left: "50%",
              }
            : {}),
        },
      };
    case ELinkType.BRANCH_PLACEHOLDER_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
      };
    case ELinkType.BRANCH_PLACEHOLDER_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
      };
    default:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
      };
  }
};

export const getHandleConfig = (
  id: WorkflowPort,
  direction: ResizeControlDirection = "horizontal",
): getHandleConfigProps => {
  const baseId = getHandleBaseId(id);
  const config = getConfig(id, direction);
  const { position: initialPosition } = getConfig(id, "horizontal");
  const defaultConfig: Partial<HandleProps> = {
    id,
    style: {
      ...getHandleDimensions(baseId, config.position, direction),
      ...getBorderRadius(initialPosition, direction),
      background: "#555",
    },
  };

  return merge(config, defaultConfig);
};
