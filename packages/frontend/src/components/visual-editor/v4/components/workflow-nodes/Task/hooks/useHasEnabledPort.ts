/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useReactFlow } from "@xyflow/react";

import { useWorkflowNode } from "@/components/visual-editor/v4/hooks/useWorkflowNode";
import {
  ENodeType,
  type NodeData,
} from "@/components/visual-editor/v4/types/workflow-node.types";

export const useHasEnabledPort = <T extends ENodeType>() => {
  const { getNode } = useReactFlow();
  const { groupName, connections } = useWorkflowNode<T>();

  return connections
    .filter((c) => c.target)
    .some((c) => {
      const targetNode = getNode(c.target) as NodeData | undefined;
      const targetGroupName =
        targetNode?.data && "groupName" in targetNode.data
          ? targetNode.data.groupName
          : undefined;
      const connectionFromAGroup = groupName && !targetGroupName;
      const connectionCrossGroups =
        groupName && targetGroupName && groupName !== targetGroupName;

      return connectionFromAGroup || connectionCrossGroups;
    });
};
