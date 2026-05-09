/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Node, NodeChange, OnNodesChange } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { GraphNode } from "../types/workflow-node.types";
import type { WorkflowSelectionSnapshot } from "../types/workflow-selection.types";
import {
  createWorkflowSelectionSnapshotFromMap,
  isSameWorkflowSelection,
} from "../utils/workflow-selection.utils";

type UseWorkflowSelectionControllerProps = {
  isEmptyWorkflow: boolean;
  nodes: GraphNode[];
  selectedNodeIds: string[];
  onChange?: (selection: WorkflowSelectionSnapshot) => void;
};

type UseWorkflowSelectionControllerResult = {
  onNodesChange: OnNodesChange<Node>;
  emitSelection: (requestedNodeIds: string[]) => void;
};

export const useWorkflowSelectionController = ({
  isEmptyWorkflow,
  nodes,
  selectedNodeIds,
  onChange,
}: UseWorkflowSelectionControllerProps): UseWorkflowSelectionControllerResult => {
  const selectedNodeIdsRef = useRef<string[]>(selectedNodeIds);
  const selectionRef = useRef<WorkflowSelectionSnapshot>({
    nodeIds: [],
    nodes: [],
  });
  const nodesById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const emitSelection = useCallback(
    (requestedNodeIds: string[]) => {
      if (
        requestedNodeIds.length > 0 &&
        !isEmptyWorkflow &&
        nodes.length === 0
      ) {
        return;
      }

      const nextSelection = createWorkflowSelectionSnapshotFromMap(
        requestedNodeIds,
        nodesById,
      );

      if (isSameWorkflowSelection(nextSelection, selectionRef.current)) {
        return;
      }

      selectionRef.current = nextSelection;
      selectedNodeIdsRef.current = nextSelection.nodeIds;
      onChange?.(nextSelection);
    },
    [isEmptyWorkflow, nodes.length, nodesById, onChange],
  );
  const onNodesChange: OnNodesChange<Node> = useCallback(
    (changes) => {
      const selectionEvents = changes.filter(
        (
          change,
        ): change is NodeChange<Node> & {
          type: "select";
          id: string;
          selected: boolean;
        } => change.type === "select",
      );

      if (!selectionEvents.length) {
        return;
      }

      const nextSelection = new Set(selectedNodeIdsRef.current);

      selectionEvents.forEach(({ id, selected }) => {
        if (selected) {
          nextSelection.add(id);
        } else {
          nextSelection.delete(id);
        }
      });

      emitSelection(Array.from(nextSelection));
    },
    [emitSelection],
  );

  useEffect(() => {
    emitSelection(selectedNodeIds);
  }, [emitSelection, selectedNodeIds]);

  return {
    onNodesChange,
    emitSelection,
  };
};
