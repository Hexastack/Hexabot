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
import { useCallback, useMemo, type MouseEvent } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import type { EdgeInsertData } from "../../types/workflow-path.types";
import { PulseIconButton } from "../PulseIconButton";

export const EDGE_HOVER_CLASSNAME = "hovered" as const;

export const EdgeWithButton = ({
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
  data,
}: EdgeProps) => {
  const { t } = useTranslate();
  const edgeData = data as EdgeInsertData | undefined;
  const insertPath = edgeData?.insertPath;
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
  const handleOpenInsertMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!insertPath) {
        return;
      }

      edgeData?.onOpenInsertMenu?.(event.currentTarget, insertPath);
    },
    [edgeData, insertPath],
  );
  const showInsert = Boolean(insertPath && edgeData?.onOpenInsertMenu);

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
            <span style={{ display: "inline-flex" }}>
              <PulseIconButton
                type="button"
                size={25}
                className="nodrag nopan"
                aria-label={t("button.add")}
                aria-haspopup="menu"
                onClick={handleOpenInsertMenu}
              >
                <Plus size={14} />
              </PulseIconButton>
            </span>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
};
