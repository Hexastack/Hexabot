/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Workflow } from "@hexabot-ai/types";

export const normalizeQuery = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "");

export const fuzzyMatchIndices = (query: string, text: string): number[] => {
  if (!query) return [];
  const normalizedText = text.toLowerCase();
  let queryIndex = 0;
  const matches: number[] = [];

  for (let textIndex = 0; textIndex < normalizedText.length; textIndex += 1) {
    if (normalizedText[textIndex] === query[queryIndex]) {
      matches.push(textIndex);
      queryIndex += 1;
    }
    if (queryIndex >= query.length) break;
  }

  return queryIndex === query.length ? matches : [];
};

export const buildHighlightSegments = (text: string, matches: number[]) => {
  if (!matches.length) return [{ text, highlight: false }];
  const matchSet = new Set(matches);
  const segments: { text: string; highlight: boolean }[] = [];
  let buffer = "";
  let isHighlighted = matchSet.has(0);

  for (let i = 0; i < text.length; i += 1) {
    const shouldHighlight = matchSet.has(i);

    if (shouldHighlight !== isHighlighted && buffer) {
      segments.push({ text: buffer, highlight: isHighlighted });
      buffer = "";
      isHighlighted = shouldHighlight;
    }
    buffer += text[i];
  }

  if (buffer) {
    segments.push({ text: buffer, highlight: isHighlighted });
  }

  return segments;
};

// @todo: (error count is not part of the typing, maybe expose the info in the useWorkflowDefinitionState hook)
export const getErrorCount = (workflow: Workflow) => {
  const value = (workflow as { errorCount?: number }).errorCount;

  return typeof value === "number" && value > 0 ? value : 0;
};

// @todo: revisit (move to useWorkflowDefinitionState hook ?)
export const isDraftWorkflow = (workflow: Workflow) => {
  return !workflow.publishedVersion;
};
