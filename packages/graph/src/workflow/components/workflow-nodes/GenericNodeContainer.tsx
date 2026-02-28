/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { PropsWithChildren } from "react";

export const GenericNodeContainer = ({ children }: PropsWithChildren) => {
  return <div className="workflow-node-shell">{children}</div>;
};
