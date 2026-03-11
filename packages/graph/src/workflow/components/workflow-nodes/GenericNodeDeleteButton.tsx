/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Trash2 } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

import { useWorkflowGraphHost } from "../../contexts/workflow-graph-host.context";
import { useWorkflowNode } from "../../hooks/useWorkflowNode";

type StepRemovableNodeType = "task" | "operator";
const STEP_REMOVABLE_NODE_TYPES = new Set<StepRemovableNodeType>([
  "task",
  "operator",
]);

export const GenericNodeDeleteButton = () => {
  const { translate, onRemoveStep, onRemoveBinding } = useWorkflowGraphHost();
  const { id, type, stepId, stepPath, taskName, bindingKind, bindingName } =
    useWorkflowNode();
  const isStepRemovable =
    !!stepPath &&
    typeof type === "string" &&
    STEP_REMOVABLE_NODE_TYPES.has(type as StepRemovableNodeType);
  const isBindingRemovable = !!(
    onRemoveBinding &&
    stepPath &&
    stepId &&
    taskName &&
    bindingKind &&
    bindingName
  );
  const handleDelete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (isBindingRemovable) {
        onRemoveBinding?.({
          nodeId: id,
          stepId,
          stepPath,
          taskName,
          bindingKind,
          bindingName,
        });

        return;
      }

      if (!isStepRemovable || !stepPath) {
        return;
      }

      onRemoveStep(stepPath, id);
    },
    [
      bindingKind,
      bindingName,
      id,
      isBindingRemovable,
      isStepRemovable,
      onRemoveBinding,
      onRemoveStep,
      stepId,
      stepPath,
      taskName,
    ],
  );

  if (!isBindingRemovable && !isStepRemovable) {
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
