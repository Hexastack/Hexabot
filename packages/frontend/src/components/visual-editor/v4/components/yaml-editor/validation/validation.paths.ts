/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { LineCounter, Node, parseDocument } from "yaml";

export type ReferencePath = Array<string | number>;

type YamlDocument = ReturnType<typeof parseDocument>;

// Fallback range so Monaco can still surface a marker when node mapping fails.
const DEFAULT_RANGE = {
  startLineNumber: 1,
  startColumn: 1,
  endLineNumber: 1,
  endColumn: 2,
};
// Convert YAML node offsets to Monaco ranges while guaranteeing a visible span.
const getRangeFromNode = (
  node: Node | null | undefined,
  lineCounter: LineCounter,
) => {
  if (!node?.range) return null;
  const [startOffset, , endOffset] = node.range;
  const startPos = lineCounter.linePos(startOffset);
  const endPos = lineCounter.linePos(endOffset);
  const startLineNumber = startPos.line || 1;
  const startColumn = startPos.col || 1;
  const endLineNumber = endPos.line || startLineNumber;
  let endColumn = endPos.col || startColumn + 1;

  if (endLineNumber === startLineNumber && endColumn <= startColumn) {
    endColumn = startColumn + 1;
  }

  return { startLineNumber, startColumn, endLineNumber, endColumn };
};

// Resolve a YAML path to the most specific range we can find for stable markers.
export const getRangeForPath = (
  doc: YamlDocument,
  path: ReferencePath,
  lineCounter: LineCounter,
) => {
  const directNode = doc.getIn(path, true) as Node | undefined;
  const directRange = getRangeFromNode(directNode, lineCounter);

  if (directRange) {
    return directRange;
  }

  if (path.length > 0) {
    const parentNode = doc.getIn(path.slice(0, -1), true) as Node | undefined;
    const parentRange = getRangeFromNode(parentNode, lineCounter);

    if (parentRange) {
      return parentRange;
    }
  }

  return DEFAULT_RANGE;
};
