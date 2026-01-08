/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { NodeProps } from "@xyflow/react";
import type { FC } from "react";

import { WorkflowNodeProvider } from "../../../providers/WorkflowNodeProvider";
import { ENodeType, type NodeData } from "../../../types/workflow-node.types";

import { IndicatorIcon } from "./IndicatorIcon";
import { IndicatorPorts } from "./IndicatorPorts";
import { IndicatorTitle } from "./IndicatorTitle";

export const Indicator: FC<NodeProps<NodeData<ENodeType.INDICATOR>>> = ({
  id,
}) => (
  <WorkflowNodeProvider id={id}>
    <IndicatorIcon />
    <IndicatorPorts />
    <IndicatorTitle />
  </WorkflowNodeProvider>
);
