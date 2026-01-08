/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useNodeConnections } from "@xyflow/react";
import { useMemo } from "react";

import { ELinkType, ENodeType, Port } from "../types/workflow-node.types";
import { getHandleConfig } from "../utils/handle.utils";

import { useWorkflow } from "./useWorkflow";
import { useWorkflowNode } from "./useWorkflowNode";

export const useHandleConfig = <T extends ENodeType>(handlerId: Port<T>) => {
  const { direction } = useWorkflow();
  const { id } = useWorkflowNode();
  const connections = useNodeConnections();
  const sourceConnections = useMemo(
    () => connections.filter((c) => c.source === id),
    [id, connections],
  );
  const otherLinks = useMemo(
    () =>
      Object.values(ELinkType)
        .filter((l) => l !== handlerId)
        .map(String),
    [handlerId],
  );
  const isActive = useMemo(
    () =>
      sourceConnections.findIndex(
        (c) => c.sourceHandle && otherLinks.includes(c.sourceHandle),
      ) > -1,
    // eslint-disable-next-line react-hooks/use-memo
    [JSON.stringify(sourceConnections), JSON.stringify(otherLinks)],
  );

  return getHandleConfig(handlerId, isActive, direction);
};
