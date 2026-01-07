/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid } from "@mui/material";
import { NodeProps } from "@xyflow/react";
import { FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, NodeData } from "../../../types/workflow-node.types";

import { TaskAction } from "./TaskAction";
import { TaskBody } from "./TaskBody";
import { TaskContainer } from "./TaskContainer";
import { TaskHeader } from "./TaskHeader";
import { TaskPorts } from "./TaskPorts";

export const Task: FC<NodeProps<NodeData<ENodeType.TASK>>> = ({ id }) => (
  <WorkflowNodeProvider id={id}>
    <TaskContainer>
      <TaskPorts />
      <Grid container height="100%" direction="row">
        <Grid item width={50}>
          <TaskAction />
        </Grid>
        <Grid item xs>
          <TaskHeader />
          <TaskBody />
        </Grid>
      </Grid>
    </TaskContainer>
  </WorkflowNodeProvider>
);
