/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid } from "@mui/material";
import { ReactFlowProvider } from "@xyflow/react";
import dynamic from "next/dynamic";

import { VisualEditorProvider3 } from "./providers/VisualEditorProvider";

const Diagram = dynamic(async () => await import("./components/Diagram"), {
  ssr: false,
});
const Aside = dynamic(() => import("./components/Aside"), { ssr: false });

export const VisualEditor3 = () => {
  return (
    <ReactFlowProvider>
      <VisualEditorProvider3>
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
              <Diagram />
            </Grid>
          </Grid>
        </Grid>
      </VisualEditorProvider3>
    </ReactFlowProvider>
  );
};
