/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useContext } from "react";

import { VisualEditorContext } from "../contexts/VisualEditorContext";
import { IVisualEditorContext } from "../types/visual-editor.types";

export const useVisualEditor = (): IVisualEditorContext => {
  const context = useContext(VisualEditorContext);

  if (!context) {
    throw new Error(
      "useVisualEditor must be used within an VisualEditorContext",
    );
  }

  return context;
};
