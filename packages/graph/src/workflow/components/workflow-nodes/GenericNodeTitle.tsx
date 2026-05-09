/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { CSSProperties } from "react";

import { useWorkflowGraphHost } from "../../contexts/workflow-graph-host.context";
import { useWorkflowNode } from "../../hooks/useWorkflowNode";
import { ENodeType } from "../../types/workflow-node.types";

import { GenericNodeIcon } from "./GenericNodeIcon";

const normalizeTitle = (text?: string) => {
  return text?.replaceAll("_", " ");
};

export const GenericNodeTitle = <T extends ENodeType = ENodeType>() => {
  const { translate } = useWorkflowGraphHost();
  const { title, i18nTitle, resolvedTheme } = useWorkflowNode<T>();
  const { color } = resolvedTheme;
  const normalizedTitle = i18nTitle
    ? translate(i18nTitle)
    : normalizeTitle(title);

  return (
    <div className="workflow-node-title-row">
      <GenericNodeIcon />
      <div
        className="workflow-node-title-text-wrap"
        style={{ "--workflow-node-title-color": color } as CSSProperties}
      >
        <div className="workflow-node-title-text" title={normalizedTitle}>
          {normalizedTitle}
        </div>
      </div>
    </div>
  );
};
