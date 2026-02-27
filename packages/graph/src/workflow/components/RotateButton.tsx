/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ControlButton, useReactFlow } from "@xyflow/react";
import type { ResizeControlDirection } from "@xyflow/system";
import { RotateCw } from "lucide-react";

type RotateButtonProps = {
  direction?: ResizeControlDirection;
  title?: string;
  fitViewDelay?: number;
  fitViewDuration?: number;
  onRotate?: (
    direction: ResizeControlDirection,
  ) => Promise<boolean | void> | boolean | void;
};

export const RotateButton = ({
  direction = "horizontal",
  title = "Rotate",
  fitViewDelay = 100,
  fitViewDuration = 100,
  onRotate,
}: RotateButtonProps) => {
  const { fitView } = useReactFlow();

  return (
    <ControlButton
      aria-label={title}
      title={title}
      onClick={async () => {
        if (!onRotate) {
          return;
        }

        const toggledDirection =
          direction === "horizontal" ? "vertical" : "horizontal";
        const shouldFitView = (await onRotate(toggledDirection)) !== false;

        if (!shouldFitView) {
          return;
        }

        setTimeout(() => {
          void fitView({ duration: fitViewDuration, interpolate: "smooth" });
        }, fitViewDelay);
      }}
    >
      <RotateCw
        size={14}
        style={{
          transition: "transform 0.2s",
          transform: `rotate(${direction === "horizontal" ? "50deg" : "140deg"})`,
        }}
      />
    </ControlButton>
  );
};
