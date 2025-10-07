/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Tooltip } from "@mui/material";

import { useGet } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";

import { getBlockConfig } from "../../utils/block.utils";

import { NodeControls } from "./NodeControls";

export const NodeHeader = ({ blockId }: { blockId: string }) => {
  const { data: block } = useGet(blockId, { entity: EntityType.BLOCK });

  if (!block?.message) {
    return null;
  }

  const config = getBlockConfig(block.message);

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(to top, ${config.color}ff, ${config.color}dd)`,
      }}
      className="node-title"
    >
      <NodeControls blockId={blockId} />
      <div className="node-header-icon">
        <config.Icon width={22} height={22} />
      </div>

      <Tooltip
        sx={{ minHeight: "135px" }}
        arrow
        title={block?.name}
        placement="top"
      >
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {block?.name}{" "}
        </div>
      </Tooltip>
    </div>
  );
};
