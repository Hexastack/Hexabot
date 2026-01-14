/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useNodesInitialized } from "@xyflow/react";
import { useEffect } from "react";

import { useWorkflow } from "./useWorkflow";

interface CbProps {
  nodesToFocus: string[];
  selectedNodes: string[];
  nodesInitialized: boolean;
}

export const useNodesMeasured = (cb: (props: CbProps) => void) => {
  const nodesInitialized = useNodesInitialized();
  const { toFocusIds, selectedNodeIds } = useWorkflow();

  useEffect(() => {
    cb({
      nodesToFocus: toFocusIds,
      selectedNodes: selectedNodeIds,
      nodesInitialized,
    });
  }, [nodesInitialized]);
};
