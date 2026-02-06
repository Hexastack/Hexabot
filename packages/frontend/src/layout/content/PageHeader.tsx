/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box } from "@mui/material";
import { LucideIcon } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";

import { Title } from "./Title";

export const PageHeader = (
  props: PropsWithChildren<{
    title?: string;
    icon?: LucideIcon;
    chip?: ReactNode;
  }>,
) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "nowrap",
        width: "100%",
        alignItems: "flex-end",
      }}
    >
      {props.title || props.icon ? (
        <Title title={props.title || ""} Icon={props.icon} chip={props.chip} />
      ) : null}
      {props.children}
    </Box>
  );
};
