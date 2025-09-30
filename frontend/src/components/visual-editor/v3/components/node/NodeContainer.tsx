/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
