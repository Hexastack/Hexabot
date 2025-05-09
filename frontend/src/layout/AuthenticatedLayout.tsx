/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid } from "@mui/material";
import { useState } from "react";

import { LayoutProps } from ".";

import { ChatWidget } from "@/app-components/widget/ChatWidget";
import { useSocketGetQuery } from "@/websocket/socket-hooks";

import { Content } from "./content";
import { Header } from "./Header";
import { VerticalMenu } from "./VerticalMenu";

export const AuthenticatedLayout: React.FC<LayoutProps> = ({
  children,
  sxContent,
  ...rest
}) => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  useSocketGetQuery("/message/subscribe/");

  useSocketGetQuery("/subscriber/subscribe/");

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
