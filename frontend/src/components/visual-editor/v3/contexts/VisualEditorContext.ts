/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { createContext } from "react";

import { IVisualEditorContext } from "../types/visual-editor.types";

export const VisualEditorContext = createContext<IVisualEditorContext>({
  getCentroid: () => ({ x: 0, y: 0 }),
  selectNodes: () => {},
  selectedNodeIds: [],
  getBlockFromCache: () => undefined,
  selectedCategoryId: undefined,
  setSelectedNodeIds: () => {},
  setSelectedCategoryId: () => {},
  toFocusIds: [],
  setToFocusIds: () => {},
  openSearchPanel: false,
  setOpenSearchPanel: () => {},
  updateCachePreviousBlocks() {},
} as IVisualEditorContext);
