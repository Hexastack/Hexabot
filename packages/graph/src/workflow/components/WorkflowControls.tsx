/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useTheme } from "@mui/material/styles";
import { Controls } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";

import { RotateButton } from "./RotateButton";

type WorkflowControlsProps = {
  direction?: ResizeControlDirection;
  onRotate?: (
    direction: ResizeControlDirection,
  ) => Promise<boolean | void> | boolean | void;
  onFitView?: () => void;
  fitViewDuration?: number;
};

export const WorkflowControls = ({
  direction,
  onRotate,
  onFitView,
  fitViewDuration = 200,
}: WorkflowControlsProps) => {
  const theme = useTheme();

  return (
    <Controls
      onFitView={onFitView}
      fitViewOptions={{ duration: fitViewDuration }}
      style={{
        overflow: "hidden",
        borderRadius: theme.shape.borderRadius,
      }}
    >
      <RotateButton direction={direction} onRotate={onRotate} />
    </Controls>
  );
};
