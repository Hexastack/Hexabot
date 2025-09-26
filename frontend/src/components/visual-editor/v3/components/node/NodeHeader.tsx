/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

import { useGet } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";

import { getBlockConfig } from "../../utils/block.utils";

import { NodeControls } from "./NodeControls";

export const NodeHeader = ({ blockId }: { blockId: string }) => {
  const { data: block } = useGet(blockId, { entity: EntityType.BLOCK });
  const config = getBlockConfig(block?.message as any);

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(to top, ${config.color}ff, ${config.color}dd)`,
      }}
      className="node-title"
    >
      <NodeControls blockId={blockId} />
      {block?.starts_conversation ? (
        <div
          className="start-point-container"
          style={{
            position: "absolute",
            left: "-60px",
          }}
        >
          <PlayArrowRoundedIcon className="start-point" />
          <div
            style={{
              position: "relative",
              left: "17px",
              top: "34px",
              borderLeft: "1px solid #999",
              borderBottom: "1px solid #999",
              width: "30px",
              height: "20px",
            }}
          />
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          backgroundColor: "white",
          borderRadius: "100%",
          padding: "2px",
        }}
      >
        <config.Icon width={32} height={32} />
      </div>
      {block?.name}
    </div>
  );
};
