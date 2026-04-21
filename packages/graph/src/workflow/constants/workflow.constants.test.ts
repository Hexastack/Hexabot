/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { ENodeType } from "../types/workflow-node.types";

import { NODE_DIMENSIONS, NODE_METRICS } from "./workflow.constants";

const CARD_NODE_TYPES: ENodeType[] = [
  ENodeType.BINDING_SINGLE,
  ENodeType.BINDING_MULTI,
  ENodeType.INDICATOR,
  ENodeType.TASK,
  ENodeType.OPERATOR,
];
const DESCRIPTION_MIN_HEIGHT = 14;
const getRequiredChromeHeight = (nodeType: ENodeType): number => {
  const card = NODE_METRICS[nodeType]?.card;

  if (!card) {
    return 0;
  }

  const descriptionHeight =
    card.contentVariant === "title-with-description"
      ? DESCRIPTION_MIN_HEIGHT
      : 0;

  return (
    card.paddingY * 2 +
    card.borderWidth * 2 +
    card.titleMinHeight +
    descriptionHeight
  );
};

describe("workflow node metrics", () => {
  it("keeps single and multi binding node heights aligned to 76px", () => {
    expect(NODE_DIMENSIONS[ENodeType.BINDING_SINGLE]?.height).toBe(76);
    expect(NODE_DIMENSIONS[ENodeType.BINDING_MULTI]?.height).toBe(76);
  });

  it("ensures card nodes have enough height for card chrome", () => {
    CARD_NODE_TYPES.forEach((nodeType) => {
      const height = NODE_METRICS[nodeType]?.dimensions.height ?? 0;

      expect(height).toBeGreaterThanOrEqual(getRequiredChromeHeight(nodeType));
    });
  });

  it("derives NODE_DIMENSIONS from NODE_METRICS dimensions", () => {
    Object.entries(NODE_METRICS).forEach(([nodeType, nodeMetrics]) => {
      expect(NODE_DIMENSIONS[nodeType as ENodeType]).toEqual(
        nodeMetrics.dimensions,
      );
    });
  });
});
