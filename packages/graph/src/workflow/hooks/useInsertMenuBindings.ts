/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Edge } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";

import type {
  GraphNode,
  WorkflowGraphData,
} from "../types/workflow-node.types";
import { ENodeType } from "../types/workflow-node.types";
import type {
  EdgeInsertType,
  FlowStepPath,
  OnOpenInsertMenu,
} from "../types/workflow-path.types";

type UseInsertMenuBindingsProps = {
  graphData: WorkflowGraphData;
  onInsertAtPath?: (insertType: EdgeInsertType, path: FlowStepPath) => void;
};

type InsertMenuBindingResult = {
  edges: Edge[];
  nodes: GraphNode[];
  insertMenuAnchorEl: HTMLElement | null;
  isInsertMenuOpen: boolean;
  closeInsertMenu: () => void;
  insertFromMenu: (insertType: EdgeInsertType) => void;
};

const withInsertMenuHandler = <T extends { data?: unknown }>(
  item: T,
  onOpenInsertMenu: OnOpenInsertMenu,
): T => {
  const itemData = item.data as { insertPath?: FlowStepPath } | undefined;

  if (!itemData?.insertPath) {
    return item;
  }

  return {
    ...item,
    data: {
      ...itemData,
      onOpenInsertMenu,
    },
  };
};

export const useInsertMenuBindings = ({
  graphData,
  onInsertAtPath,
}: UseInsertMenuBindingsProps): InsertMenuBindingResult => {
  const [insertMenuAnchorEl, setInsertMenuAnchorEl] =
    useState<HTMLElement | null>(null);
  const [insertMenuPath, setInsertMenuPath] = useState<FlowStepPath | null>(
    null,
  );
  const openInsertMenu = useCallback<OnOpenInsertMenu>((anchorEl, path) => {
    setInsertMenuAnchorEl(anchorEl);
    setInsertMenuPath(path);
  }, []);
  const closeInsertMenu = useCallback(() => {
    setInsertMenuAnchorEl(null);
    setInsertMenuPath(null);
  }, []);
  const insertFromMenu = useCallback(
    (insertType: EdgeInsertType) => {
      if (!insertMenuPath || !onInsertAtPath) {
        return;
      }

      onInsertAtPath(insertType, insertMenuPath);
    },
    [insertMenuPath, onInsertAtPath],
  );
  const edges = useMemo(() => {
    if (!onInsertAtPath) {
      return graphData.edges;
    }

    return graphData.edges.map((edge) =>
      withInsertMenuHandler(edge, openInsertMenu),
    );
  }, [graphData.edges, onInsertAtPath, openInsertMenu]);
  const nodes = useMemo(() => {
    if (!onInsertAtPath) {
      return graphData.nodes;
    }

    return graphData.nodes.map((node) => {
      if (node.type !== ENodeType.BRANCH_PLACEHOLDER) {
        return node;
      }

      return withInsertMenuHandler(node, openInsertMenu);
    });
  }, [graphData.nodes, onInsertAtPath, openInsertMenu]);

  return {
    edges,
    nodes,
    insertMenuAnchorEl,
    isInsertMenuOpen: Boolean(insertMenuAnchorEl && insertMenuPath),
    closeInsertMenu,
    insertFromMenu,
  };
};
