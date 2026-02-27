/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { PropsWithChildren } from "react";

import { useWorkflowNode } from "../../hooks/useWorkflowNode";

export const GenericNodeContainer = ({ children }: PropsWithChildren) => {
  const { height, width } = useWorkflowNode();

  return (
    <div
      style={{
        position: "relative",
        ...(width && height
          ? {}
          : {
              minWidth: "calc(100% + 10px)",
              minHeight: "calc(100% + 10px)",
            }),
        padding: "5px",
      }}
    >
      {children}
    </div>
  );
};
