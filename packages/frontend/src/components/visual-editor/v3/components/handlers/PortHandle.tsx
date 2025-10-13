/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Handle, HandleProps } from "@xyflow/react";

export const PortHandle = (props: HandleProps) => {
  return (
    <Handle
      {...props}
      style={{
        background: "#555",
        width: "10px",
        height: "15px",
        ...props.style,
      }}
    />
  );
};
