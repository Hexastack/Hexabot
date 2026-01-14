/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useMemo } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { useWorkflow } from "../../hooks/useWorkflow";
import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

export const GenericNodeTitle = <T extends ENodeType = ENodeType>() => {
  const { t } = useTranslate();
  const { direction } = useWorkflow();
  const workflowNode = useWorkflowNode<T>();
  const title = useMemo(() => {
    return "i18n" in workflowNode
      ? t(workflowNode.i18n)
      : "title" in workflowNode
        ? workflowNode.title
        : "";
  }, [workflowNode.id]);
  const color = useMemo(() => {
    return "color" in workflowNode.theme ? workflowNode.theme.color : "";
  }, [workflowNode.theme]);
  const bgColor = useMemo(() => {
    return workflowNode.theme.bgColor;
  }, [workflowNode.theme.bgColor]);

  return (
    <div
      title={title}
      style={{
        position: "absolute",
        fontWeight: 600,
        ...(direction === "horizontal"
          ? { top: "calc(100% + 6px)" }
          : {
              top: "40%",
              right: 0,
              transform: `translateX(-${(workflowNode.width || 0) + 6}px)`,
              transformOrigin: 0,
            }),
        color,
        fontSize: "13px",
        backgroundColor: "#fff",
        backgroundImage: `linear-gradient(to top, ${bgColor}22, ${bgColor}00)`,
        borderRadius: "8px",
        border: `1px solid ${bgColor}99`,
        textTransform: "uppercase",
        display: "inline-block",
        padding: "0 6px",
        whiteSpace: "nowrap",
        ...(direction === "horizontal" && {
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: (workflowNode.width || 0) + 15,
        }),
        zIndex: 2,
        transition: "transform .2s",
      }}
    >
      {title}
    </div>
  );
};
