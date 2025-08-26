/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import BackspaceIcon from "@mui/icons-material/Backspace";
import ClearIcon from "@mui/icons-material/Clear";
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
import React, { useEffect, useMemo, useRef, useState } from "react";

import { ErrorState } from "@/app-components/displays/ErrorState";
import { useFind } from "@/hooks/crud/useFind";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { BlockType, IBlockSearchResult } from "@/types/block.types";
import { determineType, getIconForType } from "@/utils/block.utils";

import { useVisualEditor } from "./hooks/useVisualEditor";

type BlockSearchItem = {
  id: string;
  name: string;
  categoryId: string;
  categoryLabel: string;
  blockTextContent: string;
  fallbackTextContent?: string;
  score: number;
  type: BlockType;
};

type BlockSearchResult = {
  item: BlockSearchItem;
  refIndex: number;
};

export type SearchScope = "current" | "all";
export interface BlockSearchPanelProps {
  open: boolean;
  onClose: () => void;
}

const Panel = styled(Box)(() => ({
  position: "absolute",
  top: 16,
  right: 16,
  width: 420,
  maxHeight: "calc(100% - 120px)", // Vertical offset to prevent overlap with the chat widget launcher
  background: "#fff",
  border: "1px solid #E0E0E0",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  borderRadius: 12,
  zIndex: 8,
  display: "flex",
  flexDirection: "column",
  padding: 8,
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

export const BlockSearchPanel: React.FC<BlockSearchPanelProps> = ({
  open,
  onClose,
}) => {
  const MAX_ITEMS_PER_PAGE = 10;
  const { t } = useTranslate();
  const { selectedCategoryId, focusBlock } = useVisualEditor();
  const [scope, setScope] = useState<SearchScope>("all");
  const [searchTerm, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shownCount, setShownCount] = useState(MAX_ITEMS_PER_PAGE);
  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const scrollIndexTrackerRef = useRef<number | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Backend block search
  const {
    data: backendResults = [],
    isLoading: isLoadingSearch,
    error: blockSearchError,
    refetch: refetchSearch,
  } = useFind(
    { entity: EntityType.BLOCK_SEARCH },
    {
      hasCount: false,
      params: {
        q: searchTerm,
        limit: 200,
        category: scope === "current" ? selectedCategoryId : undefined,
      },
    },
    { enabled: open && Boolean(searchTerm && searchTerm.trim().length > 0) },
  );
  // Fetch categories to resolve category labels locally
  // TODO: Remove this fetch when the backend search query response includes category labels directly.
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
  // Loading and error states
  const loading = isLoadingSearch || isLoadingCategories;
  const error = blockSearchError || categoriesError;
  // Map backend results into UI items
  const items: BlockSearchItem[] = useMemo(() => {
    return backendResults.map((blockEntry: IBlockSearchResult) => {
      const type = determineType(blockEntry.message);

      return {
        id: blockEntry.id,
        name: blockEntry.name,
        categoryId: String(blockEntry.category ?? ""),
        categoryLabel:
          categoryLabelById.get(String(blockEntry.category)) ??
          String(blockEntry.category ?? ""),
        blockTextContent:
          typeof blockEntry.message === "string"
            ? blockEntry.message
            : Array.isArray(blockEntry.message)
            ? blockEntry.message.join(" ")
            : typeof blockEntry.message === "object" &&
              blockEntry.message &&
              "text" in blockEntry.message
            ? String(blockEntry.message.text ?? "")
            : "",
        fallbackTextContent: Array.isArray(
          blockEntry.options?.fallback?.message,
        )
          ? blockEntry.options?.fallback?.message.join(" ")
          : "",
        type,
        score: blockEntry.score,
      };
    });
  }, [backendResults, categoryLabelById]);
  const [searchResults, setResults] = useState<BlockSearchResult[]>([]);
  const visibleCount = Math.min(searchResults.length, shownCount);
  const visibleSearchItems = useMemo(() => {
    if (!searchTerm) return [];

    return items.map((item, idx) => ({
      item,
      refIndex: idx,
    }));
  }, [searchTerm, items]);
  const debouncedSearch = useMemo(
    () =>
      debounce((results: BlockSearchResult[]) => {
        setResults(results);
      }, 200),
    [],
  );

  // Perform search when query changes
  useEffect(() => {
    debouncedSearch(visibleSearchItems);

    return () => debouncedSearch.clear();
  }, [debouncedSearch, visibleSearchItems]);

  // Reset pagination and selection when the query changes
  useEffect(() => {
    setShownCount(MAX_ITEMS_PER_PAGE);
    setSelectedIndex(0);
  }, [searchTerm]);

  // After increasing shownCount, scroll/select the first newly visible item
  useEffect(() => {
    if (scrollIndexTrackerRef.current != null) {
      const idx = scrollIndexTrackerRef.current;
      const el = itemRefs.current[idx];

      el?.scrollIntoView({ block: "nearest" });
      setSelectedIndex(idx);
      scrollIndexTrackerRef.current = null;
    }
  }, [shownCount]);

  // Navigation in the search results handlers
  const goTo = (idx: number) => {
    if (idx < 0 || idx >= visibleCount) return;

    setSelectedIndex(idx);
    const el = itemRefs.current[idx];

    el?.scrollIntoView({ block: "nearest" });
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
    refetchSearch();
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
          <ClearIcon />
        </IconButton>
      </PanelHeader>
      <SearchInput>
        {/* TODO: Replace TextField with FilterTextfield component */}
        <TextField
          autoFocus={open}
          inputRef={inputRef}
          fullWidth
          size="small"
          value={searchTerm}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder.search_blocks")}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton aria-label="clear" onClick={() => setQuery("")}>
                  <BackspaceIcon />
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
          ctaText={t("button.retry")}
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
      ) : searchResults.length === 0 && searchTerm ? (
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
          <Typography align="center">
            {t("message.no_matching_results")}
          </Typography>
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
            <Box>
              {searchResults.slice(0, visibleCount).map((res, idx) => {
                const item = res.item;
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
                const isActive = idx === selectedIndex;
                const Icon = getIconForType(item?.type || BlockType.PLUGIN);

                return (
                  <div
                    key={item?.id ?? idx}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                  >
                    <ListItem
                      button
                      selected={isActive}
                      onClick={() => activate(idx)}
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
            </Box>
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
                {t("button.show_more")}
              </Button>
            </Box>
          ) : null}
        </>
      )}
    </Panel>
  );
};

export default BlockSearchPanel;
