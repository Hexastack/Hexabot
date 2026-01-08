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
        style:
          direction === "horizontal"
            ? {
                left: "-6px",
                borderTopRightRadius: "0",
                borderBottomRightRadius: "0",
              }
            : {
                top: "-6px",
                borderBottomLeftRadius: "0",
                borderBottomRightRadius: "0",
              },
      };
    case ELinkType.GROUP_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        style:
          direction === "horizontal"
            ? {
                right: "-6px",
                borderTopLeftRadius: "0",
                borderBottomLeftRadius: "0",
              }
            : {
                bottom: "-6px",
                borderTopLeftRadius: "0",
                borderTopRightRadius: "0",
              },
      };
    case ELinkType.INDICATOR_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style:
          direction === "horizontal"
            ? {
                left: "-6px",
                borderTopRightRadius: "0",
                borderBottomRightRadius: "0",
              }
            : {
                top: "-6px",
                borderBottomLeftRadius: "0",
                borderBottomRightRadius: "0",
              },
      };
    case ELinkType.INDICATOR_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        isConnectable: false,
        isValidConnection: () => false,
        style:
          direction === "horizontal"
            ? {
                right: "-6px",
                borderTopLeftRadius: "0",
                borderBottomLeftRadius: "0",
              }
            : {
                bottom: "-6px",
                borderTopLeftRadius: "0",
                borderTopRightRadius: "0",
              },
      };
    case ELinkType.OPERATOR_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style:
          direction === "horizontal"
            ? {
                left: "-6px",
                borderTopRightRadius: "0",
                borderBottomRightRadius: "0",
              }
            : {
                top: "-6px",
                borderBottomLeftRadius: "0",
                borderBottomRightRadius: "0",
              },
      };
    case ELinkType.OPERATOR_OUT:
      return {
        type: EHandleType.SOURCE,
        position: direction === "horizontal" ? Position.Right : Position.Bottom,
        isConnectable: false,
        isValidConnection: () => false,
        style:
          direction === "horizontal"
            ? {
                right: "-6px",
                borderTopLeftRadius: "0",
                borderBottomLeftRadius: "0",
              }
            : {
                bottom: "-6px",
                borderTopLeftRadius: "0",
                borderTopRightRadius: "0",
              },
      };
    case ELinkType.TASK_IN:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style:
          direction === "horizontal"
            ? {
                top: "50%",
                left: "-6px",
                borderTopRightRadius: "0",
                borderBottomRightRadius: "0",
              }
            : {
                top: "-6px",
                borderBottomLeftRadius: "0",
                borderBottomRightRadius: "0",
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
        style:
          direction === "horizontal"
            ? {
                top: "50%",
                right: "-6px",
                borderTopLeftRadius: "0",
                borderBottomLeftRadius: "0",
              }
            : {
                bottom: "-7px",
                borderTopLeftRadius: "0",
                borderTopRightRadius: "0",
              },
      };

    default:
      return {
        type: EHandleType.TARGET,
        position: direction === "horizontal" ? Position.Left : Position.Top,
        style: {
          top: "70px",
          left: "-6px",
          borderTopRightRadius: "0",
          borderBottomRightRadius: "0",
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
      width: direction === "horizontal" ? "10px" : "15px",
      height: direction === "horizontal" ? "15px" : "10px",
      background: "#555",
    },
  };

  return merge(config, defaultConfig);
};
