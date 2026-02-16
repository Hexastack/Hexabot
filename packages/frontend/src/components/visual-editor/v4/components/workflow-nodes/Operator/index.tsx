/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import type { NodeProps } from "@xyflow/react";
import type { CSSProperties, FC } from "react";

import { useWorkflow } from "../../../hooks/useWorkflow";
import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type GraphNode } from "../../../types/workflow-node.types";
import { getConditionalOperatorOutHandleMeta } from "../../../utils/handle.utils";
import { GenericNodeContainer } from "../GenericNodeContainer";
import { GenericNodePorts } from "../GenericNodePorts";
import { GenericNodeRightContent } from "../GenericNodeRightContent";
import { GenericNodeTitle } from "../GenericNodeTitle";

const getOutPortLabelStyle = (
  direction: "horizontal" | "vertical",
  progress: number,
): CSSProperties =>
  direction === "vertical"
    ? {
        position: "absolute",
        top: "calc(100% + 8px)",
        left: `${progress}%`,
        transform: "translateX(-50%)",
      }
    : {
        position: "absolute",
        left: "calc(100% + 8px)",
        top: `${progress}%`,
        transform: "translateY(-50%)",
      };

export const Operator: FC<NodeProps<GraphNode<ENodeType.OPERATOR>>> = ({
  id,
  data,
}) => {
  const { direction = "horizontal" } = useWorkflow();

  return (
    <WorkflowNodeProvider id={id}>
      <div>
        <GenericNodeContainer>
          <GenericNodeRightContent>
            <GenericNodeTitle />
          </GenericNodeRightContent>
          <GenericNodePorts<ENodeType.OPERATOR>
            getDisabled={({ idx, node }) => !!node.groupName && idx === 0}
          />
          {data?.operatorType === StepType.Conditional
            ? data.conditionPortLabels?.map(({ handleId, label }) => {
                const meta = getConditionalOperatorOutHandleMeta(handleId);

                if (!meta) {
                  return null;
                }

                const progress = ((meta.index + 1) / (meta.total + 1)) * 100;

                return (
                  <span
                    key={handleId}
                    className="workflow-operator-port-label nodrag nopan"
                    style={getOutPortLabelStyle(direction, progress)}
                  >
                    {label}
                  </span>
                );
              })
            : null}
          {data?.operatorType === StepType.Parallel && data.strategy ? (
            <span
              className="workflow-operator-port-label nodrag nopan"
              style={getOutPortLabelStyle(direction, 50)}
            >
              {data.strategy}
            </span>
          ) : null}
        </GenericNodeContainer>
      </div>
    </WorkflowNodeProvider>
  );
};
