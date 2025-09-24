/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Node, Position, useReactFlow } from "@xyflow/react";
import { memo } from "react";

import { CustomContainer } from "../components/node/CustomContainer";
import { NodeBody } from "../components/node/NodeBody";
import { NodeHeader } from "../components/node/NodeHeader";
import { NodeBlockData } from "../Diagrams3";
import CustomHandle from "../handlers/CustomHandle";

const CustomNode = ({ id: blockId }: Node<NodeBlockData>) => {
  const { getNodeConnections } = useReactFlow();
  const connections = getNodeConnections({ nodeId: blockId });
  const disableNextBlocks = !!connections.find(
    (c) => c.sourceHandle === "attached",
  );
  const disableAttached = !!connections.find(
    (c) => c.sourceHandle === "nextBlocks",
  );

  return (
    <CustomContainer blockId={blockId}>
      <CustomHandle
        type="target"
        position={Position.Left}
        connectionCount={2}
        style={{
          left: "-2px",
          background: "#eee",
          width: "28px",
          height: "28px",
          borderRadius: "11px",
        }}
      />
      <NodeHeader blockId={blockId} />
      <NodeBody blockId={blockId} />
      <CustomHandle
        type="source"
        position={Position.Right}
        connectionCount={2}
        id="nextBlocks"
        style={{
          top: "80px",
          background: "#eee",
          width: "28px",
          height: "28px",
          borderRadius: "11px",
        }}
        isValidConnection={disableNextBlocks}
      />
      <CustomHandle
        type="source"
        position={Position.Right}
        connectionCount={2}
        id="attached"
        style={{
          top: "120px",
          background: "#eee",
          width: "28px",
          height: "28px",
          borderRadius: "11px",
        }}
        isValidConnection={disableAttached}
      />
    </CustomContainer>
  );
};

export default memo(CustomNode);
