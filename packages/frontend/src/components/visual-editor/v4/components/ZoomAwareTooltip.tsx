/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Tooltip, type TooltipProps } from "@mui/material";
import type { ReactElement, ReactNode } from "react";

type ZoomAwareTooltipProps = {
  title?: ReactNode;
  placement?: TooltipProps["placement"];
  children: ReactElement;
};

const DEFAULT_MAX_WIDTH_PX = 220;

export const ZoomAwareTooltip = ({
  title,
  placement = "top",
  children,
}: ZoomAwareTooltipProps) => {
  return (
    <Tooltip
      title={title ?? ""}
      open={Boolean(title)}
      placement={placement}
      arrow
      disableInteractive
      disableHoverListener
      disableFocusListener
      disableTouchListener
      slotProps={{
        popper: {
          disablePortal: true,
          sx: {
            pointerEvents: "none",
            zIndex: 1,
          },
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 6], // [skidding, distance] - e.g., 0px skidding, 10px distance
              },
            },
          ],
        },
        tooltip: {
          sx: {
            maxWidth: `${DEFAULT_MAX_WIDTH_PX}px`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        },
      }}
    >
      {children}
    </Tooltip>
  );
};
