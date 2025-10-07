/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, debounce, styled } from "@mui/material";
import { useReactFlow, Viewport } from "@xyflow/react";
import { useRouter } from "next/router";
import {
  DragEvent,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useSearch } from "@/hooks/useSearch";
import { EntityType, Format } from "@/services/types";
import { IBlock, IBlockAttributes } from "@/types/block.types";

import { BlockSearchPanel } from "../../components/search-panel/BlockSearchPanel";
import { BulkButtonsGroup } from "../components/main/BulkButtonsGroup";
import { FlowsTabs } from "../components/main/FlowsTabs";
import { ReactFlowWrapper } from "../components/ReactFlowWrapper";
import { useCreateBlock } from "../hooks/useCreateBlocks";
import { useVisualEditor } from "../hooks/useVisualEditor";
import {
  getAttachedLinksFromBlocks,
  getNextBlocksLinksFromBlocks,
  getNodesFromBlocks,
  getStartLinks,
} from "../utils/block.utils";

const StyledBox = styled(Box)(() => ({
  position: "relative",
  height: "100%",
}));

export const Main = () => {
  const router = useRouter();
  const { screenToFlowPosition, setViewport } = useReactFlow();
  const { selectedCategoryId, setSelectedCategoryId, setSelectedNodeIds } =
    useVisualEditor();
  const { createNode } = useCreateBlock();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const { searchPayload } = useSearch<EntityType.BLOCK>({
    $eq: [{ category: selectedCategoryId }],
  });
  const { data: categories } = useFind(
    { entity: EntityType.CATEGORY },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
    {
      onSuccess([category]) {
        if (!selectedCategoryId) {
          setSelectedCategoryId(category?.id);
        }
      },
    },
  );
  const { mutate: updateCategory } = useUpdate(EntityType.CATEGORY, {
    invalidate: false,
  });
  const { mutate: updateBlock } = useUpdate(EntityType.BLOCK);
  const { data: blocks } = useFind(
    { entity: EntityType.BLOCK, format: Format.FULL },
    { hasCount: false, params: searchPayload },
    {
      enabled: !!selectedCategoryId,
      keepPreviousData: true,
    },
  );
  const startLinks = useMemo(() => {
    return getStartLinks(blocks);
  }, [JSON.stringify(blocks.map((b) => b.starts_conversation))]);
  const nextBlocksLinks = useMemo(
    () => getNextBlocksLinksFromBlocks(blocks),
    [JSON.stringify(blocks.map((b) => b.nextBlocks))],
  );
  const attachedLinks = useMemo(
    () => getAttachedLinksFromBlocks(blocks),
    [JSON.stringify(blocks.map((b) => b.attachedBlock))],
  );
  const nodes = useMemo(() => {
    return getNodesFromBlocks(blocks);
  }, [
    JSON.stringify(blocks.map((b) => b.starts_conversation)),
    JSON.stringify(
      blocks.map((b) => {
        return {
          ...b,
          position: undefined,
          updatedAt: undefined,
          previousBlocks: undefined,
          attachedToBlock: undefined,
          attachedBlock: undefined,
          nextBlocks: undefined,
        };
      }),
    ),
  ]);
  const currentCategory = useMemo(() => {
    return categories.find(({ id }) => id === selectedCategoryId);
  }, [categories, selectedCategoryId]);
  const defaultViewport = useMemo(() => {
    if (currentCategory) {
      const { offset = [0, 0], zoom = 1 } = currentCategory;

      return {
        x: offset?.[0],
        y: offset?.[1],
        zoom: zoom > 4 ? zoom / 100 : zoom,
      };
    }

    return {
      x: 0,
      y: 0,
      zoom: 1,
    };
  }, [currentCategory]);
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const isCmdF = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f";

      if (isCmdF) {
        e.preventDefault();
        setSearchOpen(true);
      }
    },
    [],
  );
  const handleUpdateBlock = useCallback(
    debounce(({ id, ...rest }: Partial<IBlock> & { id: string }) => {
      updateBlock({
        id,
        params: {
          ...rest,
        },
      });
    }, 400),
    [updateBlock],
  );
  const handleUpdateCategory = useCallback(
    debounce(({ zoom, x, y }: Viewport) => {
      if (selectedCategoryId) {
        updateCategory({
          id: selectedCategoryId,
          params: {
            zoom: zoom < 4 ? zoom * 100 : zoom,
            offset: [x, y],
          },
        });
      }
    }, 400),
    [updateCategory, selectedCategoryId],
  );
  const dropHandler = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const diagramNode = event.dataTransfer.getData("diagram-node");

      if (!diagramNode) return;

      let data: IBlockAttributes;

      try {
        data = JSON.parse(diagramNode);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Invalid JSON in drop event", error);

        return;
      }

      if (!data) {
        // eslint-disable-next-line no-console
        console.warn("Unable to handle the drop event");

        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const payload = {
        ...data,
        category: selectedCategoryId || "",
        position,
      };

      createNode(undefined, payload);
    },
    [createNode, screenToFlowPosition, selectedCategoryId],
  );

  useEffect(() => {
    const { id: flowId } = router.query;

    if (flowId) {
      if (typeof flowId === "string") {
        setSelectedCategoryId(flowId);
      }
    } else if (categories.length) {
      setSelectedCategoryId(categories[0].id);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.id]);

  useEffect(() => {
    setViewport(defaultViewport);
  }, [currentCategory?.id]);

  useEffect(() => {
    const { blockIds } = router.query;

    if (!blockIds) {
      setSelectedNodeIds([]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.blockIds]);

  useEffect(() => {
    return () => {
      handleUpdateBlock.clear();
    };
  }, [handleUpdateBlock]);

  useEffect(() => {
    return () => {
      handleUpdateCategory.clear();
    };
  }, [handleUpdateCategory]);

  return (
    <div
      onDrop={dropHandler}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      className="visual-editor"
    >
      <FlowsTabs
        onSearchClick={(e) => {
          setSearchOpen((prev) => !prev);
          e.preventDefault();
        }}
      />
      <BulkButtonsGroup />
      <StyledBox ref={canvasRef} onKeyDown={handleKeyDown}>
        {currentCategory ? (
          <ReactFlowWrapper
            onMoveNode={handleUpdateBlock}
            onViewport={handleUpdateCategory}
            defaultEdges={[...startLinks, ...nextBlocksLinks, ...attachedLinks]}
            defaultNodes={nodes}
            defaultViewport={defaultViewport}
          />
        ) : null}
        <BlockSearchPanel
          canvasRef={canvasRef}
          open={isSearchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </StyledBox>
    </div>
  );
};
