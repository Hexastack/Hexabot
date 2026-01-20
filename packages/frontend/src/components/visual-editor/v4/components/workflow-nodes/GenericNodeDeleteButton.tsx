/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { removeStepAtPath } from "@hexabot-ai/agentic";
import { IconButton, Tooltip } from "@mui/material";
import { Trash2 } from "lucide-react";
import { useCallback, type MouseEvent } from "react";
import { stringify } from "yaml";

import { useTranslate } from "@/hooks/useTranslate";

import { useWorkflow } from "../../hooks/useWorkflow";
import { useWorkflowNode } from "../../hooks/useWorkflowNode";

export const GenericNodeDeleteButton = () => {
  const { t } = useTranslate();
  const { id, stepPath } = useWorkflowNode();
  const {
    definition,
    setDefinition,
    setYaml,
    selectedFlowId,
    selectedNodeIds,
    selectNodes,
    updateWorkflowURL,
  } = useWorkflow();
  const handleDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!definition || !stepPath) {
        return;
      }

      const nextDefinition = removeStepAtPath(definition, stepPath);

      if (!nextDefinition) {
        return;
      }

      setDefinition(nextDefinition);
      setYaml(stringify(nextDefinition));

      if (!selectedNodeIds.includes(id)) {
        return;
      }

      const nextSelection = selectedNodeIds.filter(
        (nodeId) => nodeId !== id,
      );

      selectNodes(nextSelection);

      if (selectedFlowId) {
        updateWorkflowURL(selectedFlowId, nextSelection);
      }
    },
    [
      definition,
      id,
      selectedFlowId,
      selectedNodeIds,
      selectNodes,
      setDefinition,
      setYaml,
      stepPath,
      updateWorkflowURL,
    ],
  );

  if (!stepPath) {
    return null;
  }

  return (
    <Tooltip title={t("button.delete")}>
      <IconButton
        className="nodrag nopan workflow-node-delete"
        size="small"
        color="error"
        aria-label={t("button.delete")}
        onClick={handleDelete}
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          zIndex: 5,
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: 1,
          "&:hover": {
            backgroundColor: "background.paper",
          },
        }}
      >
        <Trash2 size={14} />
      </IconButton>
    </Tooltip>
  );
};
