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
  ...rest
}: MessageFooterProps) {
  return (
    <Box
      component="div"
      className={className}
      sx={{
        display: "flex",
        fontSize: "0.8em",
        mt: 0.2,
        mx: 0.2,
        color: "text.secondary",
      }}
      {...rest}
    >
      {typeof children !== "undefined" ? (
        children
      ) : (
        <>
          <Box component="div">{sender}</Box>
          <Box component="div" sx={{ ml: "auto", pl: 0.8 }}>
            {sentTime}
          </Box>
        </>
      )}
    </Box>
  );
}

MessageFooter.displayName = "Message.Footer";
