/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Handle } from "@xyflow/react";

import { useHandleConfig } from "../../hooks/useHandleConfig";
import type { ENodeType, Port } from "../../types/workflow-node.types";

export const GenericHandle = <T extends ENodeType>({ id }: { id: Port<T> }) => {
  const config = useHandleConfig(id);

  return <Handle {...config} />;
};
