/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Tooltip, type TooltipProps } from "@mui/material";
import { useStore } from "@xyflow/react";
import type { ReactElement, ReactNode } from "react";

type ZoomAwareTooltipProps = {
  title?: ReactNode;
  placement?: TooltipProps["placement"];
  children: ReactElement;
};

const ZOOM_AWARE_TOOLTIP_POPPER_CLASSNAME = "zoom-aware-tooltip";
const ZOOM_AWARE_TOOLTIP_CONTENT_CLASSNAME = "zoom-aware-tooltip__content";

export const ZoomAwareTooltip = ({
  title,
  placement = "top",
  children,
}: ZoomAwareTooltipProps) => {
  const viewportPortalContainer = useStore(
    (state) =>
      state.domNode?.querySelector<HTMLElement>(".react-flow__viewport-portal") ||
      null,
  );

  return (
    <Tooltip
      title={
        title ? (
          <span className={ZOOM_AWARE_TOOLTIP_CONTENT_CLASSNAME}>{title}</span>
        ) : (
          ""
        )
      }
      open={Boolean(title)}
      placement={placement}
      arrow
      disableInteractive
      disableHoverListener
      disableFocusListener
      disableTouchListener
      slotProps={{
        popper: {
          className: ZOOM_AWARE_TOOLTIP_POPPER_CLASSNAME,
          disablePortal: !viewportPortalContainer,
          container: viewportPortalContainer || undefined,
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -5], // [skidding, distance] - e.g., 0px skidding, 10px distance
              },
            },
          ],
        },
      }}
    >
      {children}
    </Tooltip>
  );
};
