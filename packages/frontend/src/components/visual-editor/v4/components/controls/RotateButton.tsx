/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Typography } from "@mui/material";
import { ControlButton, useReactFlow } from "@xyflow/react";

import { useWorkflow } from "../../hooks/useWorkflow";

export const RotateButton = () => {
  const { fitView } = useReactFlow();
  const { selectedFlowId, updateWorkflow, direction, setDirection } =
    useWorkflow();

  return (
    <ControlButton
      title="Rotate"
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
                  }, 100);
                }
              },
            },
          );
        }
      }}
    >
      <Typography
        fontWeight={600}
        sx={{
          transition: "0.2s",
          transform: `rotate(${direction === "horizontal" ? "50deg" : "140deg"})`,
        }}
      >
        ↻
      </Typography>
    </ControlButton>
  );
};
