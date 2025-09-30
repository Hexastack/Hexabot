/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Node, Position, useNodeConnections } from "@xyflow/react";
import { memo, useMemo } from "react";

import CustomHandle from "../../handlers/CustomHandle";
import { NodeBlockData } from "../Diagram";

import { NodeBody } from "./NodeBody";
import { NodeContainer } from "./NodeContainer";
import { NodeHeader } from "./NodeHeader";

const CustomNode = ({ id: blockId }: Node<NodeBlockData>) => {
  const connections = useNodeConnections();
  const disableNextBlocks = useMemo(() => {
    return (
      connections.findIndex(
        (c) => c.sourceHandle === "attached" && c.source === blockId,
      ) === -1
    );
  }, [connections]);
  const disableAttached = useMemo(() => {
    return (
      connections.findIndex(
        (c) => c.sourceHandle === "nextBlocks" && c.source === blockId,
      ) === -1
    );
  }, [connections]);

  return (
    <NodeContainer blockId={blockId}>
      <CustomHandle
        type="target"
        position={Position.Left}
        style={{
          left: "-6px",
          borderTopRightRadius: "0",
          borderBottomRightRadius: "0",
        }}
      />
      <NodeHeader blockId={blockId} />
      <NodeBody blockId={blockId} />
      <CustomHandle
        type="source"
        position={Position.Right}
        id="nextBlocks"
        style={{
          right: "-6px",
          top: "80px",
          borderTopLeftRadius: "0",
          borderBottomLeftRadius: "0",
        }}
        aria-disabled={!disableNextBlocks}
        isConnectable={disableNextBlocks}
      />
      <CustomHandle
        type="source"
        position={Position.Right}
        id="attached"
        style={{
          right: "-6px",
          top: "120px",
          borderTopLeftRadius: "0",
          borderBottomLeftRadius: "0",
        }}
        aria-disabled={!disableAttached}
        isConnectable={disableAttached}
      />
    </NodeContainer>
  );
};

export default memo(CustomNode);
