/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid } from "@mui/material";

import { useWorkflowNode } from "../../../hooks/useWorkflowNode";
import { ENodeType } from "../../../types/workflow-node.types";

export const TaskAction = () => {
  const { theme } = useWorkflowNode<ENodeType.TASK>();
  // const color = document.documentElement.style.getPropertyValue(
  //   `--node-${action}-color`,
  // );

  return (
    <Grid
      style={{
        backgroundColor: `${theme}33`,
        textAlign: "center",
        alignContent: "center",
      }}
      width="100%"
      height="100%"
    >
      <theme.Icon width={30} height={30} />

      {/* <div className="node-header-icon">
        <theme.Icon width={22} height={22} />
      </div> */}
    </Grid>
  );
};
