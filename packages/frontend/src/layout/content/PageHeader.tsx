/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box } from "@mui/material";
import { LucideIcon } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";

import { Title } from "./Title";

export const PageHeader = ({
  title,
  icon,
  chip,
  headerLeftButtons,
  children,
}: PropsWithChildren<{
  title?: string;
  icon?: LucideIcon;
  chip?: ReactNode;
  headerLeftButtons?: React.ReactElement;
}>) => (
  <Box>
    {headerLeftButtons ? (
      <Box alignItems="start">{headerLeftButtons}</Box>
    ) : null}
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}
    >
      {(title || icon) && <Title title={title ?? ""} Icon={icon} chip={chip} />}
      {children}
    </Box>
  </Box>
);
