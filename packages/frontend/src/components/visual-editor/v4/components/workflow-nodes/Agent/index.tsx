/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid } from "@mui/material";
import { type NodeProps } from "@xyflow/react";
import { type FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type NodeData } from "../../../types/workflow-node.types";
import { GenericNodeIcon } from "../GenericNodeIcon";
import { GenericNodePorts } from "../GenericNodePorts";

import { AgentBody } from "./AgentBody";
import { AgentContainer } from "./AgentContainer";

export const Agent: FC<NodeProps<NodeData<ENodeType.AGENT>>> = ({ id }) => (
  <WorkflowNodeProvider id={id}>
    <AgentContainer>
      <Grid container height="100%" direction="row">
        <Grid
          item
          width={90}
          height="100%"
          color="gray"
          alignContent="center"
          textAlign="center"
        >
          <GenericNodeIcon />
        </Grid>
        <Grid item xs>
          <AgentBody />
        </Grid>
      </Grid>
      <GenericNodePorts />
    </AgentContainer>
  </WorkflowNodeProvider>
);
