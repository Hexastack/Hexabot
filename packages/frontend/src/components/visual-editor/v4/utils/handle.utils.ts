/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type HandleProps, Position } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import { merge } from "lodash";

import { EHandleType, ELinkType } from "../types/workflow-node.types";

type getHandleConfigProps = Omit<HandleProps, "type"> & { type: EHandleType };

const getHandleDimensions = (
  id: ELinkType,
  position: Position,
  direction: ResizeControlDirection,
) => {
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
  } else if ([ELinkType.TOOL_IN, ELinkType.MODEL_IN].includes(id)) {
    return direction === "horizontal"
      ? { width: "15px", height: "10px" }
      : {
          width: "10px",
          height: "15px",
        };
  } else if ([ELinkType.AGENT_TOOL, ELinkType.AGENT_MODEL].includes(id)) {
    return direction === "horizontal"
      ? { width: "15px", height: "10px" }
      : {
          width: "10px",
          height: "15px",
        };
  }
};
const getBorderRadiusConfig = (
  position: Position,
  direction: ResizeControlDirection,
) => {
  const isHorizontal = direction === "horizontal";

  if (position === Position.Left) {
    return isHorizontal
      ? {
          borderTopRightRadius: "0",
          borderBottomRightRadius: "0",
        }
      : {
          borderBottomLeftRadius: "0",
          borderBottomRightRadius: "0",
        };
  } else if (position === Position.Right) {
    return isHorizontal
      ? {
          borderTopLeftRadius: "0",
          borderBottomLeftRadius: "0",
        }
      : {
          borderTopLeftRadius: "0",
          borderTopRightRadius: "0",
        };
  } else if (position === Position.Bottom) {
    return isHorizontal
      ? {
          borderTopLeftRadius: "0",
          borderTopRightRadius: "0",
        }
      : {
          borderBottomRightRadius: "0",
          borderTopRightRadius: "0",
        };
  } else if (position === Position.Top) {
    return isHorizontal
      ? {
          borderBottomLeftRadius: "0",
          borderBottomRightRadius: "0",
        }
      : {
          borderTopLeftRadius: "0",
          borderBottomLeftRadius: "0",
        };
  }
};
const getConfig = (
  id: ELinkType,
  isActive: boolean,
  direction: ResizeControlDirection,
): getHandleConfigProps => {
  switch (id) {
    case ELinkType.GROUP_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style: {
          ...(direction === "horizontal" ? { left: "-6px" } : { top: "-6px" }),
          ...getBorderRadiusConfig(Position.Left, direction),
        },
      };
    case ELinkType.GROUP_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        style: {
          ...(direction === "horizontal"
            ? { right: "-6px" }
            : { bottom: "-6px" }),
          ...getBorderRadiusConfig(Position.Right, direction),
        },
      };
    case ELinkType.INDICATOR_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style: {
          ...(direction === "horizontal" ? { left: "-6px" } : { top: "-6px" }),
          ...getBorderRadiusConfig(Position.Left, direction),
        },
      };
    case ELinkType.INDICATOR_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        isConnectable: false,
        isValidConnection: () => false,
        style: {
          ...(direction === "horizontal"
            ? { right: "-6px" }
            : { bottom: "-6px" }),
          ...getBorderRadiusConfig(Position.Right, direction),
        },
      };
    case ELinkType.OPERATOR_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style: {
          ...(direction === "horizontal" ? { left: "-6px" } : { top: "-6px" }),
          ...getBorderRadiusConfig(Position.Left, direction),
        },
      };
    case ELinkType.OPERATOR_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        isConnectable: false,
        isValidConnection: () => false,
        style: {
          ...(direction === "horizontal"
            ? { right: "-6px" }
            : { bottom: "-6px" }),
          ...getBorderRadiusConfig(Position.Right, direction),
        },
      };
    case ELinkType.TASK_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style: {
          ...(direction === "horizontal"
            ? { top: "50%", left: "-6px" }
            : { top: "-6px" }),
          ...getBorderRadiusConfig(Position.Left, direction),
        },
      };
    case ELinkType.TASK_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        ...(isActive && {
          "aria-disabled": true,
          isConnectable: false,
          isValidConnection: () => false,
        }),
        style: {
          ...(direction === "horizontal"
            ? { top: "50%", right: "-6px" }
            : { bottom: "-7px" }),
          ...getBorderRadiusConfig(Position.Right, direction),
        },
      };
    case ELinkType.TASK_TOOL:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Bottom : Position.Left,
        ...(isActive && {
          "aria-disabled": true,
          isConnectable: false,
          isValidConnection: () => false,
        }),
        style: {
          ...(direction === "horizontal"
            ? {
                bottom: "-6px",
                left: 50,
              }
            : { left: "-7px" }),
          ...getBorderRadiusConfig(Position.Bottom, direction),
        },
      };
    case ELinkType.AGENT_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style: {
          ...(direction === "horizontal"
            ? { top: "50%", left: "-6px" }
            : { top: "-6px" }),
          ...getBorderRadiusConfig(Position.Left, direction),
        },
      };
    case ELinkType.AGENT_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        ...(isActive && {
          "aria-disabled": true,
          isConnectable: false,
          isValidConnection: () => false,
        }),
        style: {
          ...(direction === "horizontal"
            ? { top: "50%", right: "-6px" }
            : { bottom: "-5px" }),
          ...getBorderRadiusConfig(Position.Right, direction),
        },
      };

    case ELinkType.AGENT_MODEL:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Bottom : Position.Left,
        ...(isActive && {
          "aria-disabled": true,
          isConnectable: false,
          isValidConnection: () => false,
        }),
        style: {
          ...(direction === "horizontal"
            ? { bottom: "-6px", left: 50 }
            : { top: "40px", left: "-6px" }),
          ...getBorderRadiusConfig(Position.Bottom, direction),
        },
      };
    case ELinkType.AGENT_TOOL:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Bottom : Position.Left,
        ...(isActive && {
          "aria-disabled": true,
          isConnectable: false,
          isValidConnection: () => false,
        }),
        style: {
          ...(direction === "horizontal"
            ? { bottom: "-6px", left: 250 }
            : { top: "80px", left: "-6px" }),
          ...getBorderRadiusConfig(Position.Bottom, direction),
        },
      };
    case ELinkType.TOOL_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Top : Position.Right,
        ...(isActive && {
          "aria-disabled": true,
          isConnectable: false,
          isValidConnection: () => false,
        }),
        style: {
          ...(direction === "horizontal"
            ? {
                top: "-6px",
                left: "50%",
              }
            : {
                right: "-6px",
              }),
          ...getBorderRadiusConfig(Position.Top, direction),
        },
      };
    case ELinkType.MODEL_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Top : Position.Right,
        ...(isActive && {
          "aria-disabled": true,
          isConnectable: false,
          isValidConnection: () => false,
        }),
        style: {
          ...(direction === "horizontal"
            ? {
                top: "-6px",
                left: "50%",
              }
            : {
                right: "-6px",
              }),
          ...getBorderRadiusConfig(Position.Top, direction),
        },
      };
    default:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style: {
          top: "70px",
          left: "-6px",
          ...getBorderRadiusConfig(Position.Left, direction),
        },
      };
  }
};

export const getHandleConfig = (
  id: ELinkType,
  isActive: boolean,
  direction: ResizeControlDirection = "horizontal",
): getHandleConfigProps => {
  const config = getConfig(id, isActive, direction);
  const defaultConfig: Partial<HandleProps> = {
    id,
    style: {
      ...getHandleDimensions(id, config.position, direction),
      background: "#555",
    },
  };

  return merge(config, defaultConfig);
};
