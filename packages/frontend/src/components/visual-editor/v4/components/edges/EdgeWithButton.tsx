/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState, type MouseEvent } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import type {
  EdgeInsertData,
  EdgeInsertType,
} from "../../types/workflow-path.types";
import { PulseIconButton } from "../PulseIconButton";
import { WorkflowInsertMenu } from "../WorkflowInsertMenu";
import { ZoomAwareTooltip } from "../ZoomAwareTooltip";

export const EDGE_HOVER_CLASSNAME = "hovered" as const;

export const EdgeWithButton = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  target,
  label,
  data,
}: EdgeProps) => {
  const { t } = useTranslate();
  const edgeData = data as EdgeInsertData | undefined;
  const insertPath = edgeData?.insertPath;
  const [insertMenuAnchorEl, setInsertMenuAnchorEl] =
    useState<HTMLElement | null>(null);
  const isInsertMenuOpen = Boolean(insertMenuAnchorEl);
  const [path, labelX, labelY] = useMemo(() => {
    return getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
  }, [
    source,
    sourceX,
    sourceY,
    target,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  ]);
  const handleInsert = useCallback((type: EdgeInsertType) => {
    if (insertPath) {
      edgeData?.onInsert?.(insertPath, type);
    }
  }, [edgeData, insertPath]);
  const handleOpenInsertMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setInsertMenuAnchorEl(event.currentTarget);
    },
    [],
  );
  const handleCloseInsertMenu = useCallback(() => {
    setInsertMenuAnchorEl(null);
  }, []);
  const showInsert = Boolean(insertPath && edgeData?.onInsert);

  return (
    <>
      <BaseEdge {...{ path, style, markerEnd }} />
      {showInsert ? (
        <EdgeLabelRenderer>
          <div
            className="button-edge__label nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              display: "flex",
              alignItems: "center",
              gap: 0,
            }}
          >
            <ZoomAwareTooltip title={label} placement="top">
              <span style={{ display: "inline-flex" }}>
                <PulseIconButton
                  type="button"
                  size={25}
                  className="nodrag nopan"
                  aria-label={t("button.add")}
                  aria-controls={
                    isInsertMenuOpen ? `edge-insert-menu-${id}` : undefined
                  }
                  aria-haspopup="menu"
                  aria-expanded={isInsertMenuOpen ? "true" : undefined}
                  onClick={handleOpenInsertMenu}
                >
                  <Plus size={14} />
                </PulseIconButton>
              </span>
            </ZoomAwareTooltip>
            <WorkflowInsertMenu
              id={`edge-insert-menu-${id}`}
              anchorEl={insertMenuAnchorEl}
              open={isInsertMenuOpen}
              onClose={handleCloseInsertMenu}
              onInsert={handleInsert}
            />
          </div>
        </EdgeLabelRenderer>
      ) : label ? (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          fill="black"
          fontSize={14}
          textAnchor="middle"
          dy={0}
        >
          {label}
        </text>
      ) : null}
    </>
  );
};
