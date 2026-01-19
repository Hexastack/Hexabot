/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type FlowStepPath = Array<string | number>;

export type EdgeInsertData = {
  insertPath?: FlowStepPath;
  onInsert?: (path: FlowStepPath) => void;
};
