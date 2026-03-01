/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Viewport } from "@xyflow/react";

import { VIEWPORT_EPSILON } from "../constants/workflow.constants";

export const isSameViewport = (a: Viewport, b: Viewport): boolean =>
  Math.abs(a.x - b.x) <= VIEWPORT_EPSILON &&
  Math.abs(a.y - b.y) <= VIEWPORT_EPSILON &&
  Math.abs(a.zoom - b.zoom) <= VIEWPORT_EPSILON;
