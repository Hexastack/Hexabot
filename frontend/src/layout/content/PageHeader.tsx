/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
