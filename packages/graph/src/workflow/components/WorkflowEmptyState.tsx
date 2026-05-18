/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Plus } from "lucide-react";
import { useCallback, useState, type MouseEvent } from "react";

import { useWorkflowGraphHost } from "../contexts/workflow-graph-host.context";
import type { EdgeInsertType } from "../types/workflow-path.types";

import { PulseIconButton } from "./PulseIconButton";
import {
  WorkflowInsertContextMenu,
  type WorkflowInsertContextMenuProps,
} from "./WorkflowInsertContextMenu";

type WorkflowEmptyStateProps = {
  menuId?: string;
  onInsert: (type: EdgeInsertType) => void;
  menuClassName?: WorkflowInsertContextMenuProps["className"];
};

export const WorkflowEmptyState = ({
  menuId = "workflow-empty-state-insert-menu",
  onInsert,
  menuClassName,
}: WorkflowEmptyStateProps) => {
  const { translate } = useWorkflowGraphHost();
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const handleOpenInsertMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setMenuAnchorEl(event.currentTarget);
    },
    [],
  );
  const handleCloseInsertMenu = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  return (
    <>
      <div className="workflow-empty-state-overlay">
        <span className="workflow-empty-state-action">
          <PulseIconButton
            type="button"
            size={64}
            className="nodrag nopan"
            aria-label={translate("button.add")}
            aria-controls={isMenuOpen ? menuId : undefined}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen ? "true" : undefined}
            data-tour-id="admin-workflow-tour-empty-insert"
            onClick={handleOpenInsertMenu}
          >
            <Plus size={24} />
          </PulseIconButton>
        </span>
      </div>
      <WorkflowInsertContextMenu
        id={menuId}
        open={isMenuOpen}
        anchorEl={menuAnchorEl}
        onClose={handleCloseInsertMenu}
        onInsert={onInsert}
        className={menuClassName}
      />
    </>
  );
};
