/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import type { NodeProps } from "@xyflow/react";
import type { FC } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type GraphNode } from "../../../types/workflow-node.types";
import { ZoomAwareTooltip } from "../../ZoomAwareTooltip";
import { GenericNodeContainer } from "../GenericNodeContainer";
import { GenericNodePorts } from "../GenericNodePorts";
import { GenericNodeRightContent } from "../GenericNodeRightContent";
import { GenericNodeTitle } from "../GenericNodeTitle";

export const Operator: FC<NodeProps<GraphNode<ENodeType.OPERATOR>>> = ({
  id,
  data,
}) => {
  const { t } = useTranslate();
  const tooltipTitle =
    data?.operatorType === StepType.Parallel && data.strategy
      ? `${t("message.parallel_indicator")}: ${data.strategy}`
      : undefined;

  return (
    <WorkflowNodeProvider id={id}>
      <ZoomAwareTooltip title={tooltipTitle} placement="bottom">
        <div>
          <GenericNodeContainer>
            <GenericNodeRightContent>
              <GenericNodeTitle />
            </GenericNodeRightContent>
            <GenericNodePorts<ENodeType.OPERATOR>
              getDisabled={({ idx, node }) =>
                !!node.groupName && node.level === 0 && idx === 0
              }
            />
          </GenericNodeContainer>
        </div>
      </ZoomAwareTooltip>
    </WorkflowNodeProvider>
  );
};
