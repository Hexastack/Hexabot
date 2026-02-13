/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Handle } from "@xyflow/react";

import { useWorkflow } from "../../hooks/useWorkflow";
import type { ENodeType, Port } from "../../types/workflow-node.types";
import { getHandleConfig } from "../../utils/handle.utils";

export const GenericHandle = <T extends ENodeType>({
  id,
  hidden = false,
}: {
  id: Port<T>;
  hidden?: boolean;
}) => {
  const { direction } = useWorkflow();
  const config = getHandleConfig(id, direction);
  const hiddenStyle = hidden
    ? {
        opacity: 0,
        pointerEvents: "none" as const,
      }
    : undefined;

  return (
    <Handle
      {...config}
      isConnectable={hidden ? false : config.isConnectable}
      isValidConnection={hidden ? () => false : config.isValidConnection}
      style={{
        ...config.style,
        ...hiddenStyle,
      }}
    />
  );
};
