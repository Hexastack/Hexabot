/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Node, Position } from "@xyflow/react";
import { memo } from "react";

import { CustomContainer } from "../components/node/CustomContainer";
import { NodeBody } from "../components/node/NodeBody";
import { NodeTitle } from "../components/node/NodeTitle";
import { NodeBlockData } from "../Diagrams3";
import CustomHandle from "../handlers/CustomHandle";

const CustomNode = ({ id: blockId }: Node<NodeBlockData>) => {
  return (
    <CustomContainer blockId={blockId}>
      <CustomHandle
        type="target"
        position={Position.Left}
        connectionCount={10}
      />
      <NodeTitle blockId={blockId} />
      <NodeBody blockId={blockId} />
      <CustomHandle
        type="source"
        position={Position.Right}
        connectionCount={10}
      />
    </CustomContainer>
  );
};

export default memo(CustomNode);
