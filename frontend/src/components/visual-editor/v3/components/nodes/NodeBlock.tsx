/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { NodeProps, Position, useNodeConnections } from "@xyflow/react";
import { FC, useMemo } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { LinkType, PortType } from "../../types/visual-editor.types";
import { PortHandle } from "../handlers/PortHandle";

import { NodeBody } from "./NodeBody";
import { NodeContainer } from "./NodeContainer";
import { NodeHeader } from "./NodeHeader";

export const NodeBlock: FC<NodeProps> = ({ id: blockId }) => {
  const connections = useNodeConnections();
  const { t } = useTranslate();
  const sourceConnections = useMemo(
    () => connections.filter((c) => c.source === blockId),
    [blockId, connections],
  );
  const disableNextBlocks = useMemo(
    () =>
      sourceConnections.findIndex(
        (c) => c.sourceHandle === LinkType.ATTACHED,
      ) === -1,
    [sourceConnections],
  );
  const disableAttached = useMemo(
    () =>
      sourceConnections.findIndex(
        (c) => c.sourceHandle === LinkType.NEXT_BLOCKS,
      ) === -1,
    [sourceConnections],
  );

  if (blockId.startsWith("startPoint-")) {
    return (
      <div
        style={{
          width: "90px",
          height: "90px",
          backgroundColor: "#a6b846ee",
          textAlign: "center",
          borderRadius: "50%",
          boxShadow: "0 0 13px #0003 inset",
          outline: "none",
          pointerEvents: "none",
        }}
      >
        <PlayArrowRoundedIcon
          style={{
            color: "#fff",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "66px",
          }}
        />
        <div
          style={{
            position: "relative",
            top: "100px",
            fontWeight: 600,
            color: "#555",
            fontSize: "20px",
          }}
        >
          {t("message.start")}
        </div>
        <PortHandle
          type={PortType.SOURCE}
          position={Position.Right}
          id={LinkType.NEXT_BLOCKS}
          style={{
            right: "-6px",
            borderTopLeftRadius: "0",
            borderBottomLeftRadius: "0",
          }}
          isConnectable={false}
          isValidConnection={() => false}
        />
      </div>
    );
  }

  return (
    <NodeContainer blockId={blockId}>
      <PortHandle
        type={PortType.TARGET}
        position={Position.Left}
        style={{
          top: "96px",
          left: "-6px",
          borderTopRightRadius: "0",
          borderBottomRightRadius: "0",
        }}
      />
      <NodeHeader blockId={blockId} />
      <NodeBody blockId={blockId} />
      <PortHandle
        type={PortType.SOURCE}
        position={Position.Right}
        id={LinkType.NEXT_BLOCKS}
        style={{
          right: "-6px",
          top: "80px",
          borderTopLeftRadius: "0",
          borderBottomLeftRadius: "0",
        }}
        aria-disabled={!disableNextBlocks}
        isConnectable={disableNextBlocks}
        isValidConnection={() => disableNextBlocks}
      />
      <PortHandle
        type={PortType.SOURCE}
        position={Position.Right}
        id={LinkType.ATTACHED}
        style={{
          right: "-6px",
          top: "120px",
          borderTopLeftRadius: "0",
          borderBottomLeftRadius: "0",
        }}
        aria-disabled={!disableAttached}
        isConnectable={disableAttached}
        isValidConnection={() => disableAttached}
      />
    </NodeContainer>
  );
};
