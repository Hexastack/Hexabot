/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BoxProps, Grid } from "@mui/material";
import { useState } from "react";

import { ChatWidget } from "@/app-components/widget/ChatWidget";

import { Content } from "./content";
import { Header } from "./Header";
import { VerticalMenu } from "./VerticalMenu";

export interface IContentPaddingProps {
  hasNoPadding?: boolean;
}

export type LayoutProps = IContentPaddingProps & {
  children: JSX.Element;
  sxContent?: BoxProps;
};
export const Layout: React.FC<LayoutProps> = ({
  children,
  sxContent,
  ...rest
}) => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  return (
    <Grid container>
      <Header
        isSideBarOpen={isSideBarOpen}
        onToggleSidebar={() => setIsSideBarOpen(true)}
      />
      <VerticalMenu
        isSideBarOpen={isSideBarOpen}
        onToggleIn={() => setIsSideBarOpen(true)}
        onToggleOut={() => setIsSideBarOpen(false)}
      />
      <Content sx={sxContent} {...rest}>
        {children}
      </Content>
      <ChatWidget />
    </Grid>
  );
};
