/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NodeProps, Position, useNodeConnections } from "@xyflow/react";
import { FC, memo, useMemo } from "react";

import { LinkType, PortType } from "../../types/visual-editor.types";
import { PortHandle } from "../handlers/PortHandle";

import { NodeBody } from "./NodeBody";
import { NodeContainer } from "./NodeContainer";
import { NodeHeader } from "./NodeHeader";

const NodeBlock: FC<NodeProps> = ({ id: blockId }) => {
  const connections = useNodeConnections();
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

  return (
    <NodeContainer blockId={blockId}>
      <PortHandle
        type={PortType.TARGET}
        position={Position.Left}
        style={{
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

export default memo(NodeBlock);
