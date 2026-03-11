/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { PropsWithChildren } from "react";

type GenericNodeContainerProps = PropsWithChildren<{
  className?: string;
}>;

export const GenericNodeContainer = ({
  children,
  className,
}: GenericNodeContainerProps) => {
  return (
    <div className={`workflow-node-shell${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
};
