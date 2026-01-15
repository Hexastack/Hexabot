/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid } from "@mui/material";
import { NodeProps } from "@xyflow/react";
import { FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import {
  ELinkType,
  ENodeType,
  NodeData,
} from "../../../types/workflow-node.types";
import { GenericNodeContainer } from "../GenericNodeContainer";
import { GenericNodeDescription } from "../GenericNodeDescription";
import { GenericNodeIcon } from "../GenericNodeIcon";
import { GenericNodePorts } from "../GenericNodePorts";
import { GenericNodeTitle } from "../GenericNodeTitle";

export const Task: FC<NodeProps<NodeData<ENodeType.TASK>>> = ({ id }) => (
  <WorkflowNodeProvider id={id}>
    <GenericNodeContainer>
      <GenericNodeIcon hasBgColor />
      <Grid xs flexDirection="column" pl="10px">
        <GenericNodeTitle />
        <GenericNodeDescription />
      </Grid>
    </GenericNodeContainer>
    <GenericNodePorts<ENodeType.TASK>
      getDisabled={({ port, hasEnabledPort }) =>
        port === ELinkType.TASK_OUT && hasEnabledPort
      }
    />
  </WorkflowNodeProvider>
);
