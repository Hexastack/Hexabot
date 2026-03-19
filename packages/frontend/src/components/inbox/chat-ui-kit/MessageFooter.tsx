/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Box from "@mui/material/Box";

import { MessageFooterProps } from "./types";

export function MessageFooter({
  sender = "",
  sentTime = "",
  children,
  className,
  sx,
  ...rest
}: MessageFooterProps) {
  return (
    <Box
      component="div"
      className={className}
      sx={[
        {
          display: "flex",
          typography: "caption",
          mt: 0.5,
          mx: 0.5,
          color: "text.secondary",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {typeof children !== "undefined" ? (
        children
      ) : (
        <>
          <Box component="div">{sender}</Box>
          <Box component="div" sx={{ ml: "auto", pl: 1 }}>
            {sentTime}
          </Box>
        </>
      )}
    </Box>
  );
}

MessageFooter.displayName = "Message.Footer";
