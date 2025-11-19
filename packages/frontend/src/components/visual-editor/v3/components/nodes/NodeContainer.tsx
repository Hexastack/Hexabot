/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import clsx from "clsx";
import { PropsWithChildren } from "react";

import { useGet } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";

import { getBlockConfig } from "../../utils/block.utils";

export const NodeContainer = ({
  blockId,
  children,
}: { blockId: string } & PropsWithChildren) => {
  const { data: block } = useGet(blockId, { entity: EntityType.BLOCK });

  if (!block?.message) {
    return null;
  }

  const config = getBlockConfig(block.message);

  return (
    <div
      className={clsx("custom-node")}
      style={{
        border: `1px solid ${config.color}`,
      }}
    >
      {children}
    </div>
  );
};
