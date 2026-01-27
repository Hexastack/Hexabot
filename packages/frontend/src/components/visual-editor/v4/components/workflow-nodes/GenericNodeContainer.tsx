/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useNodeId, useReactFlow } from "@xyflow/react";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { useSubscribe } from "@/websocket/socket-hooks";

import { useWorkflow } from "../../hooks/useWorkflow";
import { EIndicatorType } from "../../types/workflow-node.types";
import { SubscribeWorkflowProps } from "../../types/workflow.types";

const getStepId = (id: string) =>
  `^step-${id.replace(":", "-").replaceAll("branch.", "[^-]+").replaceAll(".", "-")}`;

export type NodeState =
  | "initial"
  | "loading"
  | "suspended"
  | "success"
  | "error";
export const GenericNodeContainer = ({ children }: PropsWithChildren) => {
  const [queue, setQueue] = useState<Record<string, NodeState>[]>([]);
  const { selectedFlowId } = useWorkflow();
  const id = useNodeId();
  const { getNodes, updateNode, getNode } = useReactFlow();
  const findNode = (criteria: string) => {
    const regexCriteria = new RegExp(criteria);

    return getNodes().find((n) => n.id.match(regexCriteria));
  };

  useSubscribe(
    "workflow",
    ({ workflowEvent, workflowId, ...rest }: SubscribeWorkflowProps) => {
      if (selectedFlowId !== workflowId) {
        return;
      }
      if (workflowEvent === "workflow:start") {
        const node = findNode(EIndicatorType.WORKFLOW_START);

        if (node?.id) {
          setQueue((old) => ({ ...old, [node?.id]: "loading" }));

          setTimeout(() => {
            setQueue((old) => ({ ...old, [node?.id]: "initial" }));
          }, 500);
        }

        // setNodeExecutionState("loading");
      } else if (workflowEvent === "workflow:finish") {
        const node = findNode(EIndicatorType.WORKFLOW_END);

        setQueue([]);

        if (node?.id) {
          setQueue((old) => ({ ...old, [node?.id]: "loading" }));

          setTimeout(() => {
            setQueue([]);
          }, 500);
        }
      } else if (workflowEvent === "workflow:suspended") {
        // TODO
      } else if (workflowEvent === "workflow:failure") {
        setQueue([]);
      } else if ("step" in rest) {
        const stepId = getStepId(rest.step.id);
        const node = findNode(stepId);

        if (node?.id === id) {
          if (workflowEvent === "step:start") {
            if (queue[id] !== "start") {
              setQueue((old) => ({ ...old, [id]: "loading" }));
            }
          } else if (workflowEvent === "step:error") {
            setQueue((old) => ({ ...old, [id]: "error" }));
          } else if (workflowEvent === "step:success") {
            setTimeout(() => {
              setQueue((old) => ({ ...old, [id]: "success" }));
            }, 500);

            setTimeout(() => {
              setQueue((old) => ({ ...old, [id]: "initial" }));
            }, 800);
          } else if (workflowEvent === "step:suspended") {
            setQueue((old) => ({ ...old, [id]: "loading" }));
            setTimeout(() => {
              setQueue((old) => ({ ...old, [id]: "suspended" }));
            }, 500);
          }
        }
      }
    },
  );

  const state = useMemo(() => {
    if (id) {
      return queue[id];
    }

    return "";
    // eslint-disable-next-line react-hooks/use-memo
  }, [id, JSON.stringify(queue)]);

  useEffect(() => {
    if (id) {
      const node = getNode(id);

      updateNode(id, {
        data: { ...node?.data, executionState: queue[id] },
      });
    }
  }, [state]);

  return (
    <div
      id="workflowNodeContainer"
      style={{
        position: "relative",
        padding: "5px",
      }}
      className={state}
    >
      {children}
    </div>
  );
};
