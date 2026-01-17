/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Tooltip } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

const normalizeTitle = (text?: string) => {
  return text?.replaceAll("_", " ");
};

export const GenericNodeTitle = <T extends ENodeType = ENodeType>() => {
  const { title, i18nTitle, theme } = useWorkflowNode<T>();
  const { t } = useTranslate();
  const normalizedTitle = i18nTitle ? t(i18nTitle) : normalizeTitle(title);

  return (
    <div
      style={{
        color: theme.color,
        display: "flex",
        fontWeight: 600,
        fontSize: "14px",
        placeItems: "center",
      }}
    >
      <Tooltip arrow title={normalizedTitle} placement="top">
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "0.875rem",
            zIndex: 4,
            textTransform: "capitalize",
          }}
        >
          {normalizedTitle}
        </div>
      </Tooltip>
    </div>
  );
};
