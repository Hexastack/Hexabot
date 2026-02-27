/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Tooltip } from "@mui/material";

import { useWorkflowGraphHost } from "../../contexts/workflow-graph-host.context";
import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { useWorkflowNodeTheme } from "../../hooks/useWorkflowNodeTheme";
import { ENodeType } from "../../types/workflow-node.types";

import { GenericNodeIcon } from "./GenericNodeIcon";

const normalizeTitle = (text?: string) => {
  return text?.replaceAll("_", " ");
};

export const GenericNodeTitle = <T extends ENodeType = ENodeType>() => {
  const { translate } = useWorkflowGraphHost();
  const { title, i18nTitle } = useWorkflowNode<T>();
  const { color } = useWorkflowNodeTheme<T>();
  const normalizedTitle = i18nTitle
    ? translate(i18nTitle)
    : normalizeTitle(title);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "20px",
        gap: "9px",
      }}
    >
      <GenericNodeIcon />
      <div
        style={{
          color,
          display: "flex",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        <Tooltip arrow title={normalizedTitle} placement="top">
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              fontWeight: 600,
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
    </div>
  );
};
