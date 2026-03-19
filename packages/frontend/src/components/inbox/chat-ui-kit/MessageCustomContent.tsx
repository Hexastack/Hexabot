/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Box from "@mui/material/Box";

import { MessageCustomContentProps } from "./types";

export function MessageCustomContent({
  children,
  className,
  ...rest
}: MessageCustomContentProps) {
  return (
    <Box component="div" className={className} {...rest}>
      {children}
    </Box>
  );
}

MessageCustomContent.displayName = "Message.CustomContent";
