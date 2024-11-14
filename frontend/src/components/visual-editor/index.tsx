/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid } from "@mui/material";
import dynamic from "next/dynamic";

const Diagrams = dynamic(() => import("./v2/Diagrams"), { ssr: false });
const VisualEditorProvider = dynamic(() => import("./hooks/useVisualEditor"), {
  ssr: false,
});
const Aside = dynamic(() => import("./Aside"), { ssr: false });

export const VisualEditor = () => {
  return (
    <VisualEditorProvider>
      <Grid
        container
        gap={2}
        flexDirection="column"
        height="calc(100vh - 64px)"
        width="100%"
      >
        <Grid container height="100%" margin="auto">
          <Aside />
          <Grid
            item
            xs
            overflow="hidden"
            sx={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Diagrams />
          </Grid>
        </Grid>
      </Grid>
    </VisualEditorProvider>
  );
};
