/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid } from "@mui/material";

import { ChatWidget } from "@/app-components/widget/ChatWidget";

import { LayoutProps } from ".";

import { Content } from "./content";
import { Header } from "./Header";

export const AnonymousLayout: React.FC<LayoutProps> = ({
  children,
  sxContent,
  ...rest
}) => (
  <Grid container>
    <Header />
    <Content sx={sxContent} {...rest}>
      {children}
    </Content>
    <ChatWidget />
  </Grid>
);
