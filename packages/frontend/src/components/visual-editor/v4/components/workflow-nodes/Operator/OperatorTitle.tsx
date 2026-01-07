/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useTranslate } from "@/hooks/useTranslate";

import { useWorkflow } from "../../../hooks/useWorkflow";
import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";

export const OperatorTitle = () => {
  const { t } = useTranslate();
  const { direction } = useWorkflow();
  const { title, theme } = useWorkflowNode<ENodeType.OPERATOR>();

  return (
    <div
      style={{
        position: "absolute",
        ...(direction === "horizontal"
          ? { top: 100 }
          : {
              top: 32,
              right: 0,
              transform: "translateX(-92px)",
            }),
        fontWeight: 600,
        color: theme.color,
        fontSize: "14px",
        background: "#fffa",
        borderRadius: "25px",
        border: "1px solid #7bb0ff66",
        textTransform: "uppercase",
        display: "inline-block",
        padding: "0 6px",
      }}
    >
      {t(title.i18n)}
    </div>
  );
};
