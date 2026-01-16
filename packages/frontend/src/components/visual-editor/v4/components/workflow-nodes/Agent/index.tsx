/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Grid from "@mui/material/Grid2";
import { type NodeProps } from "@xyflow/react";
import { type FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type NodeData } from "../../../types/workflow-node.types";
import { GenericNodeContainer } from "../GenericNodeContainer";
import { GenericNodeDescription } from "../GenericNodeDescription";
import { GenericNodeIcon } from "../GenericNodeIcon";
import { GenericNodePorts } from "../GenericNodePorts";
import { GenericNodeTitle } from "../GenericNodeTitle";

export const Agent: FC<NodeProps<NodeData<ENodeType.AGENT>>> = ({ id }) => (
  <WorkflowNodeProvider id={id}>
    <GenericNodeContainer>
      <GenericNodeIcon hasBgColor />
      <Grid size="grow" flexDirection="column" pl="10px">
        <GenericNodeTitle />
        <GenericNodeDescription />
      </Grid>
    </GenericNodeContainer>
    <GenericNodePorts />
  </WorkflowNodeProvider>
);
