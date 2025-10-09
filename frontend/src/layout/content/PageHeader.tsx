/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

import { TMenuItem } from "@/app-components/menus/Sidebar";

import { Title } from "./Title";

export const PageHeader = (
  props: PropsWithChildren<{
    title: string;
    icon: TMenuItem["Icon"];
    chip?: ReactNode;
  }>,
) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignContent: "center",
        flexWrap: "nowrap",
        width: "100%",
      }}
    >
      <Title title={props.title} icon={props.icon} chip={props.chip} />

      {props.children}
    </Box>
  );
};
