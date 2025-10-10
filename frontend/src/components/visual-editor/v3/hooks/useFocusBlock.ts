/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Node, useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { useVisualEditor } from "./useVisualEditor";

export const useFocusBlock = () => {
  const nodesInitialized = useNodesInitialized();
  const router = useRouter();
  const { getNode, fitView } = useReactFlow();
  const { selectNodes, selectedNodeIds, openSearchPanel, setToFocusIds } =
    useVisualEditor();
  const animateFocus = async (blockIds: string[] = []) => {
    selectNodes(blockIds);
    if (blockIds.length === 1) {
      const node = getNode(blockIds[0]);

      if (node) {
        await fitView({
          nodes: [node],
          padding: "150px",
          duration: 200,
        });
        setToFocusIds([]);
      }
    } else {
      const nodes = selectedNodeIds
        .map((s) => getNode(s))
        .filter((n): n is Node => !!n);

      if (nodes.length) {
        await fitView({
          nodes,
          padding: "150px",
          duration: 200,
        });
        setToFocusIds([]);
      }
    }
  };

  useEffect(() => {
    const { blockIds } = router.query;

    if (nodesInitialized && typeof blockIds === "string" && blockIds?.length) {
      const nodesIds = blockIds.split(",").filter(getNode);

      selectNodes(nodesIds);
      if (openSearchPanel) {
        animateFocus(nodesIds);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesInitialized, router.query]);

  return {
    animateFocus,
  };
};
