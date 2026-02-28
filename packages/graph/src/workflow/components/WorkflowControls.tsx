/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

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
  return (
    <Controls
      className="workflow-controls"
      onFitView={onFitView}
      fitViewOptions={{ duration: fitViewDuration }}
    >
      <RotateButton direction={direction} onRotate={onRotate} />
    </Controls>
  );
};
