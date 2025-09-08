/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Box,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import React from "react";

import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";
import { IBlockSearchResult } from "@/types/block.types";
import { getBlockExcerpt, getBlockIconByType } from "@/utils/block.utils";

export interface BlockSearchResultItemProps {
  item: IBlockSearchResult;
  isActive: boolean;
  onClick: () => void;
}

export interface VirtualizedItemData {
  items: IBlockSearchResult[];
  selectedIndex: number;
  onActivate: (index: number) => void;
}

export interface VirtualizedItemProps {
  index: number;
  style: React.CSSProperties;
  data: VirtualizedItemData;
}

export const BlockSearchResultItem: React.FC<BlockSearchResultItemProps> = ({
  item,
  isActive,
  onClick,
}) => {
  // Get category from cache for quick lookup
  const getCategoryFromCache = useGetFromCache(EntityType.CATEGORY);
  const categoryLabel =
    getCategoryFromCache(String(item.category))?.label ?? "";
  // Get Block name and excerpt
  const blockEntryName = item?.name;
  const blockEntryTextContent = getBlockExcerpt(item.message, item.options);
  const Icon = getBlockIconByType(item?.type);

  return (
    <ListItemButton
      selected={isActive}
      autoFocus={isActive}
      onClick={onClick}
      sx={{
        height: 56,
        overflow: "hidden",
      }}
    >
      <ListItemAvatar sx={{ minWidth: 44, flexShrink: 0 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon width={24} height={24} />
        </Box>
      </ListItemAvatar>
      <ListItemText
        title={blockEntryTextContent}
        primary={blockEntryName}
        secondary={categoryLabel}
        primaryTypographyProps={{ noWrap: true }}
        secondaryTypographyProps={{ noWrap: true }}
        sx={{ minWidth: 0 }}
      />
    </ListItemButton>
  );
};

// Virtualized item component for react-window
export const VirtualizedBlockSearchItem: React.FC<VirtualizedItemProps> = ({
  index,
  style,
  data,
}) => {
  const { items, selectedIndex, onActivate } = data;
  const item = items[index];
  const isActive = index === selectedIndex;

  return (
    <div style={style}>
      <BlockSearchResultItem
        item={item}
        isActive={isActive}
        onClick={() => onActivate(index)}
      />
    </div>
  );
};

export default BlockSearchResultItem;
