/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

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

  const label = translate("button.delete");

  return (
    <button
      type="button"
      className="nodrag nopan workflow-node-delete workflow-node-delete-button"
      aria-label={label}
      title={label}
      onClick={handleDelete}
    >
      <Trash2 size={14} />
    </button>
  );
};
