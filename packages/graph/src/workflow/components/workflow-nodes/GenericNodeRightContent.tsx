/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type CSSProperties, type PropsWithChildren } from "react";

import { useWorkflowNodeTheme } from "../../hooks/useWorkflowNodeTheme";
import {
  ENodeType,
  TNodeCardContentVariant,
} from "../../types/workflow-node.types";

import { GenericNodeDeleteButton } from "./GenericNodeDeleteButton";

export const GenericNodeRightContent = <T extends ENodeType = ENodeType>({
  children,
  variant = "title-only",
}: PropsWithChildren<{ variant?: TNodeCardContentVariant }>) => {
  const { bgColor, borderColor } = useWorkflowNodeTheme<T>();
  const style = {
    "--workflow-node-bg-color": bgColor,
    "--workflow-node-border-color": borderColor,
  } as CSSProperties;

  return (
    <div
      className={`workflow-node-card workflow-node-card--${variant}`}
      style={style}
    >
      <GenericNodeDeleteButton />
      {children}
    </div>
  );
};
