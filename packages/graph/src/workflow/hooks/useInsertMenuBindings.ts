/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useCallback, useState } from "react";

import type {
  EdgeInsertType,
  FlowStepPath,
  OnOpenInsertMenu,
} from "../types/workflow-path.types";

type UseInsertMenuBindingsProps = {
  onInsertAtPath?: (insertType: EdgeInsertType, path: FlowStepPath) => void;
};

type InsertMenuBindingResult = {
  insertMenuAnchorEl: HTMLElement | null;
  isInsertMenuOpen: boolean;
  openInsertMenu?: OnOpenInsertMenu;
  closeInsertMenu: () => void;
  insertFromMenu: (insertType: EdgeInsertType) => void;
};

export const useInsertMenuBindings = ({
  onInsertAtPath,
}: UseInsertMenuBindingsProps): InsertMenuBindingResult => {
  const [insertMenuAnchorEl, setInsertMenuAnchorEl] =
    useState<HTMLElement | null>(null);
  const [insertMenuPath, setInsertMenuPath] = useState<FlowStepPath | null>(
    null,
  );
  const openInsertMenu = useCallback<OnOpenInsertMenu>(
    (anchorEl, path) => {
      if (!onInsertAtPath) {
        return;
      }

      setInsertMenuAnchorEl(anchorEl);
      setInsertMenuPath(path);
    },
    [onInsertAtPath],
  );
  const closeInsertMenu = useCallback(() => {
    setInsertMenuAnchorEl(null);
    setInsertMenuPath(null);
  }, []);
  const insertFromMenu = useCallback(
    (insertType: EdgeInsertType) => {
      if (!insertMenuPath || !onInsertAtPath) {
        return;
      }

      onInsertAtPath(insertType, insertMenuPath);
    },
    [insertMenuPath, onInsertAtPath],
  );

  return {
    insertMenuAnchorEl,
    isInsertMenuOpen: Boolean(insertMenuAnchorEl && insertMenuPath),
    openInsertMenu: onInsertAtPath ? openInsertMenu : undefined,
    closeInsertMenu,
    insertFromMenu,
  };
};
