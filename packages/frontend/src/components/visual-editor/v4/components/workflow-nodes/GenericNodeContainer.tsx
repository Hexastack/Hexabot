/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PropsWithChildren, useMemo } from "react";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeContainer = <T extends ENodeType = ENodeType>({
  isRounded,
  children,
}: PropsWithChildren & { isRounded?: boolean }) => {
  const workflowNode = useWorkflowNode<T>();
  const bgColor = useMemo(() => {
    return workflowNode.theme.bgColor;
  }, [workflowNode.theme.bgColor]);

  return (
    <div
      style={{
        position: "relative",
        width: workflowNode.width,
        height: workflowNode.height,
        textAlign: "center",
        borderRadius: isRounded ? "50%" : "20%",
        outline: "none",
        pointerEvents: "none",
        border: `1px solid ${bgColor}cc`,
        boxShadow: "0 0 13px #0002 inset",
        backgroundColor: "#fffa",
        backgroundImage: `linear-gradient(to top, ${bgColor}22, ${bgColor}00)`,
      }}
    >
      {children}
    </div>
  );
};
