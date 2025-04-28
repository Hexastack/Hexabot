/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid, GridProps, SxProps, Theme } from "@mui/material";
import * as React from "react";

interface TabPanelProps {
  children?: React.ReactNode;
  index: string;
  value: string;
  sx?: SxProps<Theme>;
}

export function TabPanel(props: TabPanelProps & GridProps) {
  const { children, value, index, sx, ...other } = props;

  return (
    <Grid
      item
      xs
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      <Grid container sx={{ flexDirection: "column", ...sx }}>
        {children}
      </Grid>
    </Grid>
  );
}

export function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`,
  };
}
