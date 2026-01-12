/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ScreenRotation } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useReactFlow } from "@xyflow/react";

import { AnimatedComponent } from "@/app-components/AnimatedComponent";

import { useWorkflow } from "../../hooks/useWorkflow";

export const RotateButton = () => {
  const { fitView } = useReactFlow();
  const { selectedFlowId, updateWorkflow, direction, setDirection } =
    useWorkflow();

  return (
    <IconButton
      style={{
        position: "absolute",
        bottom: 119,
        left: 14,
        height: "26px",
        width: "28px",
        backgroundColor: "#fff",
        borderRadius: 0,
        border: "1px solid #0001",
        padding: "2px 3px",
      }}
      size="small"
      onClick={async () => {
        if (selectedFlowId) {
          const toggledDirection =
            direction === "horizontal" ? "vertical" : "horizontal";

          updateWorkflow(
            {
              id: selectedFlowId,
              params: {
                direction: toggledDirection,
              },
            },
            {
              onSuccess: async ({ direction }) => {
                if (direction) {
                  setDirection?.(direction);
                  setTimeout(() => {
                    fitView({ duration: 100, interpolate: "smooth" });
                  }, 10);
                }
              },
            },
          );
        }
      }}
    >
      <AnimatedComponent
        component={ScreenRotation}
        canRotate={direction === "vertical"}
        from="-45"
        to="45"
        htmlColor="#000000de"
      />
    </IconButton>
  );
};
