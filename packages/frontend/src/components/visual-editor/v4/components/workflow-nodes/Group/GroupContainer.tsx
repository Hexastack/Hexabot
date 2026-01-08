/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useEffect, type PropsWithChildren } from "react";

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";

export const GroupContainer = ({ children }: PropsWithChildren) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme } = useWorkflowNode<ENodeType.GROUP>();
  const { id } = useWorkflowNode();
  const nodeInitialized = useNodesInitialized();
  const { updateNode } = useReactFlow();

  useEffect(() => {
    updateNode(id, () => ({
      // style: { ...node.style, backgroundColor: "red" },
    }));
  }, [nodeInitialized]);

  return <div>{children}</div>;
};
