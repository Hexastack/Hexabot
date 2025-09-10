/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import type { ListChildComponentProps } from "react-window";

import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";
import { IBlockSearchResult } from "@/types/block.types";
import { getBlockExcerpt, getBlockIconByType } from "@/utils/block";

type BlockSearchResultsData = {
  items: IBlockSearchResult[];
  onClick?: (item: IBlockSearchResult) => void;
  selected: string | undefined; // Selected block id
};

export const BLOCK_SEARCH_RESULT_ITEM_HEIGHT = 56;

export const BlockSearchResultItem: React.FC<
  ListChildComponentProps<BlockSearchResultsData>
> = (props) => {
  const { index, style, data } = props;
  const item = data.items[index];
  const isSelected = item.id === data.selected;
  // Get category from cache for quick lookup
  const getCategoryFromCache = useGetFromCache(EntityType.CATEGORY);
  const categoryLabel =
    getCategoryFromCache(String(item.category))?.label ?? "";
  // Get Block name and excerpt
  const blockEntryName = item?.name;
  const blockEntryTextContent = getBlockExcerpt(item.message, item.options);
  const Icon = getBlockIconByType(item?.type);

  return (
    <ListItem style={style} key={index} component="div" disablePadding>
      <ListItemButton
        selected={isSelected}
        autoFocus={isSelected}
        onClick={() => data.onClick?.(item)}
        sx={{
          height: BLOCK_SEARCH_RESULT_ITEM_HEIGHT,
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
        />
      </ListItemButton>
    </ListItem>
  );
};
