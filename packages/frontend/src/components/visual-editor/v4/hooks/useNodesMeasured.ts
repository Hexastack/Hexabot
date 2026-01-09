/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useNodesInitialized } from "@xyflow/react";
import { useEffect } from "react";

import { useWorkflow } from "./useWorkflow";

export const useNodesMeasured = (
  cb: (
    nodesToFocus: string[],
    selectedNodes: string[],
    nodesInitialized: boolean,
  ) => void,
) => {
  const nodesInitialized = useNodesInitialized();
  const { toFocusIds, selectedNodeIds } = useWorkflow();

  useEffect(() => {
    cb(toFocusIds, selectedNodeIds, nodesInitialized);
  }, [nodesInitialized]);
};
