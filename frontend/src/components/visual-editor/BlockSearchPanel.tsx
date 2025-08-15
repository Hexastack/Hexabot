/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ClearIcon from "@mui/icons-material/Clear";
import MinimizeIcon from "@mui/icons-material/Minimize";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
  RadioGroup,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import debounce from "@mui/material/utils/debounce";
import { useVirtualizer } from "@tanstack/react-virtual";
import Fuse from "fuse.js";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { ErrorState } from "@/app-components/displays/ErrorState";
import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import ListIcon from "@/app-components/svg/toolbar/ListIcon";
import PluginIcon from "@/app-components/svg/toolbar/PluginIcon";
import QuickRepliesIcon from "@/app-components/svg/toolbar/QuickRepliesIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import { useFind } from "@/hooks/crud/useFind";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { BlockMessage, IBlock } from "@/types/block.types";

import { useVisualEditor } from "./hooks/useVisualEditor";

// Block type constants
const BLOCK_TYPES = {
  TEXT: "text",
  ATTACHMENT: "attachment",
  QUICK_REPLIES: "quickReplies",
  BUTTONS: "buttons",
  LIST: "list",
  PLUGIN: "plugin",
} as const;

type BlockType = (typeof BLOCK_TYPES)[keyof typeof BLOCK_TYPES];

// Infer block type based on message shape
const determineType = (message: BlockMessage): BlockType => {
  if (typeof message === "string" || Array.isArray(message))
    return BLOCK_TYPES.TEXT;
  if (message && typeof message === "object") {
    if ("attachment" in message) return BLOCK_TYPES.ATTACHMENT;
    if ("quickReplies" in message) return BLOCK_TYPES.QUICK_REPLIES;
    if ("buttons" in message) return BLOCK_TYPES.BUTTONS;
    if ("elements" in message) return BLOCK_TYPES.LIST;
  }

  return BLOCK_TYPES.PLUGIN;
};
// Get icon component for a given block type
const getIconForType = (type: BlockType) => {
  const iconMap: Record<BlockType, React.ComponentType<any>> = {
    [BLOCK_TYPES.TEXT]: SimpleTextIcon,
    [BLOCK_TYPES.ATTACHMENT]: AttachmentIcon,
    [BLOCK_TYPES.QUICK_REPLIES]: QuickRepliesIcon,
    [BLOCK_TYPES.BUTTONS]: ButtonsIcon,
    [BLOCK_TYPES.LIST]: ListIcon,
    [BLOCK_TYPES.PLUGIN]: PluginIcon,
  };

  return iconMap[type] || PluginIcon;
};
const Panel = styled(Box)(() => ({
  position: "absolute",
  top: 0,
  right: 0,
  height: "100%",
  width: 420,
  background: "#fff",
  borderLeft: "1px solid #E0E0E0",
  boxShadow: "-6px 0 12px rgba(0,0,0,0.04)",
  zIndex: 8,
  display: "flex",
  flexDirection: "column",
  paddingBottom: "10px",
}));
const PanelHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderBottom: "1px solid #E0E0E0",
}));
const SearchInput = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  padding: 8,
  gap: 8,
}));
const ScopeToggle = styled(RadioGroup)(() => ({
  display: "flex",
  flexDirection: "row",
  gap: 16,
  padding: "0 16px",
}));
const ResultCount = styled(Box)(() => ({ padding: "4px 16px", color: "#555" }));

export type SearchScope = "current" | "all";
export interface BlockSearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export const BlockSearchPanel: React.FC<BlockSearchPanelProps> = ({
  open,
  onClose,
}) => {
  const MAX_ITEMS_PER_PAGE = 10;
  const { t } = useTranslate();
  const { selectedCategoryId, focusBlock } = useVisualEditor();
  const [scope, setScope] = useState<SearchScope>("all");
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shownCount, setShownCount] = useState(MAX_ITEMS_PER_PAGE);
  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const scrollIndexTrackerRef = useRef<number | null>(null);
  const {
    data: allBlocks = [],
    isLoading: isLoadingBlocks,
    error: blocksError,
    refetch: refetchBlocks,
  } = useFind(
    { entity: EntityType.BLOCK, format: Format.FULL },
    { hasCount: false },
    { enabled: open },
  );
  // Fetch categories to resolve category labels locally
  const {
    data: categories = [],
    error: categoriesError,
    refetch: refetchCategories,
    isLoading: isLoadingCategories,
  } = useFind(
    { entity: EntityType.CATEGORY },
    { hasCount: false },
    { enabled: open },
  );
  // Create a map of category labels by ID for quick lookup
  const categoryLabelById = useMemo(() => {
    const map = new Map<string, string>();

    categories.forEach((c) => map.set(c.id, c.label));

    return map;
  }, [categories]);
  // Filtering based on search scope
  const blocks = useMemo(() => {
    if (scope === "current" && selectedCategoryId) {
      return allBlocks.filter((block) => block.category === selectedCategoryId);
    }

    return allBlocks;
  }, [allBlocks, scope, selectedCategoryId]);
  // Loading and error states
  const loading = isLoadingBlocks || isLoadingCategories;
  const error = blocksError || categoriesError;

  type BlockSearchItem = {
    id: string;
    name: string;
    categoryId: string;
    categoryLabel: string;
    blockTextContent: string;
    fallbackTextContent: string;
    type: BlockType;
  };
  // Fuse.js setup for searching blocks
  const fuse = useMemo(() => {
    const list: BlockSearchItem[] = (blocks || []).map((b: IBlock) => {
      // Extract Block reply messages
      const extractedBlockMessages =
        typeof b.message === "string"
          ? b.message
          : Array.isArray(b.message)
          ? b.message.join(" ")
          : typeof b.message === "object" && b.message && "text" in b.message
          ? String(b.message.text || "")
          : "";
      // Extract local fallback messages
      const fallbackMessages = Array.isArray(b.options?.fallback?.message)
        ? (b.options.fallback.message as string[]).join(" ")
        : "";
      // Determine type
      const type = determineType(b.message);

      return {
        id: b.id,
        name: b.name,
        categoryId: String(b.category || ""),
        categoryLabel:
          categoryLabelById.get(String(b.category)) || String(b.category || ""),
        blockTextContent: extractedBlockMessages,
        fallbackTextContent: fallbackMessages,
        type,
      };
    });

    return new Fuse(list, {
      shouldSort: true,
      includeScore: true,
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "name", weight: 0.7 },
        { name: "blockTextContent", weight: 0.3 },
        { name: "fallbackTextContent", weight: 0.25 },
      ],
    });
  }, [blocks, categoryLabelById]);

  type SearchResult = {
    item: BlockSearchItem;
    refIndex: number;
    score?: number;
  };

  const [searchResults, setResults] = useState<SearchResult[]>([]);
  // Virtual list setup
  const visibleCount = Math.min(searchResults.length, shownCount);
  const virtualizer = useVirtualizer({
    count: visibleCount,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string) => {
        if (!searchTerm) {
          setResults([]);

          return;
        }

        const fuseSearchOutput = fuse.search(searchTerm, {
          limit: 1000,
        });

        setResults(fuseSearchOutput);
      }, 300),
    [fuse],
  );

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  // Perform search when query changes
  useEffect(() => {
    debouncedSearch(query);

    return () => debouncedSearch.clear();
  }, [debouncedSearch, query]);

  // Reset pagination and selection when the query changes
  useEffect(() => {
    setShownCount(MAX_ITEMS_PER_PAGE);
    setSelectedIndex(0);
  }, [query]);

  // After increasing shownCount, scroll/select the first newly visible item
  useEffect(() => {
    if (scrollIndexTrackerRef.current != null) {
      const idx = scrollIndexTrackerRef.current;

      virtualizer.scrollToIndex(idx, { align: "start" });
      setSelectedIndex(idx);
      scrollIndexTrackerRef.current = null;
    }
  }, [shownCount, virtualizer]);

  // Navigation in the search results handlers
  const goTo = (idx: number) => {
    if (idx < 0 || idx >= visibleCount) return;

    setSelectedIndex(idx);
    virtualizer.scrollToIndex(idx, { align: "auto" });
  };
  const activate = async (idx: number) => {
    const item = searchResults[idx]?.item;

    if (!item) return;

    await focusBlock(item.id, scope === "all" ? item.categoryId : undefined);
  };
  // Keyboard navigation handlers
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      goTo(Math.min(selectedIndex + 1, visibleCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      goTo(Math.max(selectedIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(selectedIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };
  // Reset search state
  const resetSearchState = () => {
    setResults([]);
    setQuery("");
    setShownCount(MAX_ITEMS_PER_PAGE);
    setSelectedIndex(0);
  };
  const handleRetry = () => {
    // Clear search results
    resetSearchState();

    // Refetch unified data
    refetchBlocks();
    refetchCategories();
  };

  if (!open) return null;

  return (
    <Panel role="dialog" aria-label={t("label.search_blocks_panel_header")}>
      <PanelHeader>
        <Typography variant="subtitle1" fontWeight={600} component="h2">
          {t("label.search_blocks_panel_header")}
        </Typography>
        <IconButton
          aria-label="Close search panel"
          onClick={onClose}
          size="small"
        >
          <MinimizeIcon />
        </IconButton>
      </PanelHeader>
      <SearchInput>
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder.search_blocks")}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton aria-label="clear" onClick={() => setQuery("")}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
      </SearchInput>
      <ScopeToggle
        row
        value={scope}
        onChange={(_, v) => setScope(v as SearchScope)}
      >
        <Box display="flex" alignItems="center">
          <Radio value="current" checked={scope === "current"} />
          <Typography>Current flow</Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <Radio value="all" checked={scope === "all"} />
          <Typography>All flows</Typography>
        </Box>
      </ScopeToggle>
      <Divider />
      {error ? (
        <ErrorState
          message={t("message.failed_to_load_blocks")}
          action={handleRetry}
          ctaText="Retry"
        />
      ) : loading ? (
        <Box p={2} display="grid" gap={1}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} display="flex" alignItems="center" gap={2} height={56}>
              {/* Avatar skeleton */}
              <Skeleton variant="circular" width={32} height={32} />
              {/* Text content skeleton */}
              <Box flex={1} display="flex" flexDirection="column" gap={0.5}>
                <Skeleton variant="text" width="90%" height={20} />
                <Skeleton variant="text" width="60%" height={16} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : searchResults.length === 0 && query ? (
        <Box
          p={2}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ height: "100%" }}
          flex={1}
          gap={2}
        >
          <SearchOffIcon sx={{ fontSize: 48 }} />
          <Typography>{t("message.no_matching_results")}</Typography>
        </Box>
      ) : (
        <>
          <ResultCount>
            <Typography variant="caption">
              {visibleCount} / {searchResults.length} results
            </Typography>
          </ResultCount>
          <Box
            ref={listContainerRef}
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
            }}
            onKeyDown={onKeyDown}
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const item = searchResults[virtualRow.index]?.item;
                const primary = item?.name || "";
                const secondaryParts: string[] = [];

                if (item?.blockTextContent)
                  secondaryParts.push(item.blockTextContent);
                if (item?.fallbackTextContent)
                  secondaryParts.push(
                    `(fallback: ${item.fallbackTextContent})`,
                  );
                const secondary = secondaryParts.length
                  ? secondaryParts.join(" • ")
                  : undefined;
                const isActive = virtualRow.index === selectedIndex;
                const Icon = getIconForType(item?.type || BLOCK_TYPES.PLUGIN);

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ListItem
                      button
                      selected={isActive}
                      onClick={() => activate(virtualRow.index)}
                      sx={{
                        height: "100%",
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
                        primary={primary}
                        secondary={`${item?.categoryLabel || ""}${
                          secondary ? " • " + secondary : ""
                        }`}
                        primaryTypographyProps={{ noWrap: true }}
                        secondaryTypographyProps={{ noWrap: true }}
                        sx={{ minWidth: 0 }}
                      />
                    </ListItem>
                  </div>
                );
              })}
            </div>
          </Box>
          {searchResults.length > shownCount ? (
            <Box p={1} display="flex" justifyContent="center">
              <Button
                size="small"
                onClick={() => {
                  // Remember first newly visible index, then increase page size
                  scrollIndexTrackerRef.current = shownCount;
                  setShownCount((prev) => prev + MAX_ITEMS_PER_PAGE);
                }}
              >
                {t("button.show_more") || "Show more"}
              </Button>
            </Box>
          ) : null}
        </>
      )}
    </Panel>
  );
};

export default BlockSearchPanel;
