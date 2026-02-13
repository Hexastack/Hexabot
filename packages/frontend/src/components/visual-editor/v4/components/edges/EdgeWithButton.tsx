/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState, type MouseEvent } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import {
  WORKFLOW_OPERATOR_GRAPH_THEME,
  WORKFLOW_STEP_GRAPH_THEME,
} from "../../constants/workflow-graph-theme.constants";
import type {
  EdgeInsertData,
  EdgeInsertType,
} from "../../types/workflow-path.types";
import { PulseIconButton } from "../PulseIconButton";
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
  const handleInsertStep = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handleCloseInsertMenu();
      handleInsert("step");
    },
    [handleCloseInsertMenu, handleInsert],
  );
  const handleInsertConditionalStep = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handleCloseInsertMenu();
      handleInsert(StepType.Conditional);
    },
    [handleCloseInsertMenu, handleInsert],
  );
  const handleInsertLoopStep = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handleCloseInsertMenu();
      handleInsert(StepType.Loop);
    },
    [handleCloseInsertMenu, handleInsert],
  );
  const handleSelectNoopOption = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handleCloseInsertMenu();
    },
    [handleCloseInsertMenu],
  );
  const insertMenuItems = useMemo(
    () => [
      {
        id: StepType.Conditional,
        ...WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Conditional],
        onClick: handleInsertConditionalStep,
      },
      {
        id: StepType.Loop,
        ...WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Loop],
        onClick: handleInsertLoopStep,
      },
      {
        id: StepType.Parallel,
        ...WORKFLOW_OPERATOR_GRAPH_THEME[StepType.Parallel],
        onClick: handleSelectNoopOption,
      },
      {
        id: "step",
        ...WORKFLOW_STEP_GRAPH_THEME,
        onClick: handleInsertStep,
      },
    ],
    [
      handleInsertConditionalStep,
      handleInsertLoopStep,
      handleInsertStep,
      handleSelectNoopOption,
    ],
  );
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
            <ZoomAwareTooltip title={label} placement="left-end">
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
            <Menu
              id={`edge-insert-menu-${id}`}
              anchorEl={insertMenuAnchorEl}
              open={isInsertMenuOpen}
              onClose={handleCloseInsertMenu}
              slotProps={{ list: { className: "nodrag nopan" } }}
            >
              {insertMenuItems.map((item) => (
                <MenuItem key={item.id} onClick={item.onClick}>
                  <ListItemIcon sx={{ color: item.color }}>
                    <item.Icon size={18} />
                  </ListItemIcon>
                  <ListItemText primary={t(item.i18nTitle)} />
                </MenuItem>
              ))}
            </Menu>
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
