/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Handle } from "@xyflow/react";

import { useWorkflow } from "../../hooks/useWorkflow";
import type { ENodeType, Port } from "../../types/workflow-node.types";
import { getHandleConfig } from "../../utils/handle.utils";

export const GenericHandle = <T extends ENodeType>({ id }: { id: Port<T> }) => {
  const { direction } = useWorkflow();
  const config = getHandleConfig(id, direction);

  return <Handle {...config} />;
};
