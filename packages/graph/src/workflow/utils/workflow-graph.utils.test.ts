/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import {
  WORKFLOW_VIEWPORT_MAX_ZOOM,
  WORKFLOW_VIEWPORT_MIN_ZOOM,
} from "../constants/workflow.constants";

import {
  getVisibleWorkflowBounds,
  isMeaningfulWorkflowViewport,
  isWorkflowBoundsVisibleInViewport,
  normalizeWorkflowViewportZoom,
} from "./workflow-graph.utils";

describe("workflow viewport utilities", () => {
  it("clamps persisted zoom to xyflow's supported positive range", () => {
    expect(normalizeWorkflowViewportZoom(0)).toBe(1);
    expect(normalizeWorkflowViewportZoom(-1)).toBe(1);
    expect(normalizeWorkflowViewportZoom(WORKFLOW_VIEWPORT_MIN_ZOOM / 2)).toBe(
      WORKFLOW_VIEWPORT_MIN_ZOOM,
    );
    expect(normalizeWorkflowViewportZoom(WORKFLOW_VIEWPORT_MAX_ZOOM + 1)).toBe(
      WORKFLOW_VIEWPORT_MAX_ZOOM,
    );
  });

  it("treats the default viewport as not meaningfully persisted", () => {
    expect(isMeaningfulWorkflowViewport({ x: 0, y: 0, zoom: 1 })).toBe(false);
    expect(isMeaningfulWorkflowViewport({ x: 120, y: -80, zoom: 1 })).toBe(
      true,
    );
  });

  it("derives the visible flow bounds from the current viewport", () => {
    expect(
      getVisibleWorkflowBounds({ x: -100, y: -50, zoom: 2 }, 400, 200),
    ).toEqual({
      x: 50,
      y: 25,
      width: 200,
      height: 100,
    });
  });

  it("detects when graph bounds are outside the current viewport", () => {
    const viewport = { x: 0, y: 0, zoom: 1 };

    expect(
      isWorkflowBoundsVisibleInViewport({
        bounds: { x: 50, y: 50, width: 120, height: 80 },
        viewport,
        viewportWidth: 400,
        viewportHeight: 300,
      }),
    ).toBe(true);
    expect(
      isWorkflowBoundsVisibleInViewport({
        bounds: { x: 800, y: 50, width: 120, height: 80 },
        viewport,
        viewportWidth: 400,
        viewportHeight: 300,
      }),
    ).toBe(false);
  });
});
