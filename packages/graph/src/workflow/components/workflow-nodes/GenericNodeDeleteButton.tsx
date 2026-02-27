/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IconButton, Tooltip } from "@mui/material";
import { Trash2 } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

import { useWorkflowGraphHost } from "../../contexts/workflow-graph-host.context";
import { useWorkflowNode } from "../../hooks/useWorkflowNode";

export const GenericNodeDeleteButton = () => {
  const { translate, onRemoveStep } = useWorkflowGraphHost();
  const { id, stepPath } = useWorkflowNode();
  const handleDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!stepPath) {
        return;
      }

      onRemoveStep(stepPath, id);
    },
    [id, onRemoveStep, stepPath],
  );

  if (!stepPath) {
    return null;
  }

  return (
    <Tooltip title={translate("button.delete")}>
      <IconButton
        className="nodrag nopan workflow-node-delete"
        size="small"
        color="error"
        aria-label={translate("button.delete")}
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
