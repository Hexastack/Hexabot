/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ENodeType, type EOperatorType } from "../../types/workflow-node.types";
import type { FlowStepPath } from "../../types/workflow-path.types";

type SemanticNodeMeta = {
  groupPath: string[];
  level: number;
  stepId?: string;
  stepPath?: FlowStepPath;
  isPlaceholder?: boolean;
  isAttachment?: boolean;
};

export type SemanticNode = {
  id: string;
  type: ENodeType;
  data: Record<string, unknown>;
  selectable?: boolean;
  meta: SemanticNodeMeta;
};

export type SemanticEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  hidden?: boolean;
  insertPath?: FlowStepPath;
  kind: "direct" | "group";
};

export type GroupMeta = {
  id: string;
  operatorType: EOperatorType;
  level: number;
  memberNodeIds: Set<string>;
};
