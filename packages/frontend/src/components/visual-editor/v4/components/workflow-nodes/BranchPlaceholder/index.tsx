/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";
import type { FC } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type GraphNode } from "../../../types/workflow-node.types";
import { PulseIconButton } from "../../PulseIconButton";
import { ZoomAwareTooltip } from "../../ZoomAwareTooltip";
import { GenericNodePorts } from "../GenericNodePorts";

export const BranchPlaceholder: FC<
  NodeProps<GraphNode<ENodeType.BRANCH_PLACEHOLDER>>
> = ({ id, data }) => {
  const { t } = useTranslate();
  const addLabel = t("button.add");
  const branchLabel = data?.label;

  return (
    <WorkflowNodeProvider id={id}>
      <ZoomAwareTooltip title={branchLabel} placement="left">
        <div
          className="workflow-branch-placeholder nodrag nopan"
          role="button"
          aria-label={addLabel}
        >
          <PulseIconButton
            tabIndex={-1}
            size={42}
            className="workflow-branch-placeholder__pulse"
            sx={{ pointerEvents: "none" }}
            aria-hidden
          >
            <Plus size={18} />
          </PulseIconButton>
        </div>
      </ZoomAwareTooltip>
      <GenericNodePorts<ENodeType.BRANCH_PLACEHOLDER> />
    </WorkflowNodeProvider>
  );
};
