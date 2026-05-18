/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useStore } from "@xyflow/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import { WORKFLOW_INSERT_MENU_ITEMS } from "../constants/workflow.constants";
import { useWorkflowGraphHost } from "../contexts/workflow-graph-host.context";
import type { EdgeInsertType } from "../types/workflow-path.types";

const MENU_FALLBACK_WIDTH = 220;
const MENU_FALLBACK_HEIGHT = 192;
const MENU_MARGIN = 12;
const MENU_ANCHOR_OFFSET = 8;

export type WorkflowInsertContextMenuProps = {
  id?: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onInsert: (type: EdgeInsertType) => void;
  className?: string;
};

export const WorkflowInsertContextMenu = ({
  id,
  anchorEl,
  open,
  onClose,
  onInsert,
  className,
}: WorkflowInsertContextMenuProps) => {
  const { translate } = useWorkflowGraphHost();
  const domNode = useStore((state) => state.domNode);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isOpen = open && Boolean(anchorEl);
  const [menuSize, setMenuSize] = useState({
    width: MENU_FALLBACK_WIDTH,
    height: MENU_FALLBACK_HEIGHT,
  });

  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) {
      return;
    }

    const width = menuRef.current.offsetWidth || MENU_FALLBACK_WIDTH;
    const height = menuRef.current.offsetHeight || MENU_FALLBACK_HEIGHT;

    setMenuSize((current) => {
      if (current.width === width && current.height === height) {
        return current;
      }

      return { width, height };
    });
  }, [anchorEl, isOpen]);

  const menuStyle = useMemo<CSSProperties | undefined>(() => {
    if (!isOpen || !anchorEl) {
      return undefined;
    }

    const { width, height } = menuSize;
    const anchorRect = anchorEl.getBoundingClientRect();
    const anchorX = anchorRect.left + anchorRect.width / 2;
    const anchorY = anchorRect.bottom;
    const paneRect = domNode?.getBoundingClientRect();

    if (!paneRect) {
      return {
        left: anchorX - width / 2,
        top: anchorY + MENU_ANCHOR_OFFSET,
      };
    }

    const relativeX = anchorX - paneRect.left;
    const relativeY = anchorY - paneRect.top;
    const maxLeft = Math.max(MENU_MARGIN, paneRect.width - width - MENU_MARGIN);
    const maxTop = Math.max(
      MENU_MARGIN,
      paneRect.height - height - MENU_MARGIN,
    );
    const centeredLeft = relativeX - width / 2;

    return {
      left: Math.min(Math.max(centeredLeft, MENU_MARGIN), maxLeft),
      top: Math.min(
        Math.max(relativeY + MENU_ANCHOR_OFFSET, MENU_MARGIN),
        maxTop,
      ),
    };
  }, [anchorEl, domNode, isOpen, menuSize]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!anchorEl?.isConnected) {
      onClose();
    }
  }, [anchorEl, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (target && menuRef.current?.contains(target)) {
        return;
      }

      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleMenuItemClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>, type: EdgeInsertType) => {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      onInsert(type);
    },
    [onClose, onInsert],
  );

  if (!isOpen || !menuStyle) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      id={id}
      role="menu"
      style={menuStyle}
      className={`workflow-insert-menu nodrag nopan${className ? ` ${className}` : ""}`}
    >
      <ul className="workflow-insert-menu__list">
        {WORKFLOW_INSERT_MENU_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              role="menuitem"
              className="workflow-insert-menu__item nodrag nopan"
              data-item-id={item.id}
              data-tour-id={
                item.id === "step"
                  ? "admin-workflow-tour-insert-step"
                  : undefined
              }
              onClick={(event) => {
                handleMenuItemClick(event, item.type);
              }}
            >
              <span className="workflow-insert-menu__icon">
                <item.Icon size={18} />
              </span>
              <span className="workflow-insert-menu__label">
                {translate(item.i18nTitle)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
