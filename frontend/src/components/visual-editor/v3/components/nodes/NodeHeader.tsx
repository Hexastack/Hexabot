/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
