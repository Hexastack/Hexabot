/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import BackspaceIcon from "@mui/icons-material/Backspace";
import ClearIcon from "@mui/icons-material/Clear";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Skeleton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React, { useMemo, useState } from "react";

import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { useFind } from "@/hooks/crud/useFind";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";

import BlockSearchResultItem from "./BlockSearchResultItem";
import { useVisualEditor } from "./hooks/useVisualEditor";

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
  overflow: "auto", // Enable scrolling if content overflows
}));
const PanelHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderBottom: "1px solid #E0E0E0",
}));
const ScopeToggle = styled(Tabs)(() => ({
  display: "flex",
  flexDirection: "row",
  gap: 8,
  padding: "0 8px",
  // make tabs look like compact icon tabs
  minHeight: 36,
  "& .MuiTab-root": {
    minHeight: 36,
    minWidth: 120,
    paddingLeft: 8,
    paddingRight: 8,
  },
}));
const ResultCount = styled(Box)(() => ({ padding: "4px 16px", color: "#555" }));
const PanelBody = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 120, // ensure at least one list item and footer can be shown without overlap on small viewports
  minWidth: 0,
  overflow: "hidden",
}));

export const BlockSearchPanel: React.FC<BlockSearchPanelProps> = ({
  open,
  onClose,
}) => {
  const MAX_ITEMS_PER_PAGE = 10;
  const { t } = useTranslate();
  const { toast } = useToast();
  const { selectedCategoryId, focusBlock } = useVisualEditor();
  const [scope, setScope] = useState<SearchScope>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shownCount, setShownCount] = useState(MAX_ITEMS_PER_PAGE);
  const { onSearch, searchText } = useSearch<EntityType.BLOCK_SEARCH>({});
  // Backend block search
  const {
    data: backendResults = [],
    isLoading,
    isFetching,
  } = useFind(
    { entity: EntityType.BLOCK_SEARCH },
    {
      hasCount: false,
      params: {
        q: searchText,
        category: scope === "current" ? selectedCategoryId : undefined,
      },
    },
    {
      enabled: open && Boolean(searchText && searchText.trim().length > 0),
      onSuccess() {
        setShownCount(MAX_ITEMS_PER_PAGE);
        setSelectedIndex(0);
      },
      onError() {
        toast.error(t("message.failed_to_load_blocks"));
      },
    },
  );
  // Loading state
  const loading = isLoading || isFetching;
  // Map backend results into UI items
  const visibleSearchItems = useMemo(() => {
    if (!searchText) return [];

    return backendResults.map((item, idx) => ({
      item,
      refIndex: idx,
    }));
  }, [searchText, backendResults]);
  const visibleCount = Math.min(visibleSearchItems.length, shownCount);
  // Navigation in the search results handlers
  const goTo = (idx: number) => {
    if (idx < 0 || idx >= visibleCount) return;

    setSelectedIndex(idx);
  };
  // Focus the selected block
  const activate = async (idx: number) => {
    const item = visibleSearchItems[idx]?.item;

    if (!item) return;
    setSelectedIndex(idx);
    await focusBlock(item.id, item.category);
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

  if (!open) return null;

  return (
    <Panel
      role="dialog"
      aria-label={t("label.search_blocks_panel_header")}
      onKeyDown={onKeyDown}
    >
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
      <FilterTextfield
        sx={{ p: 1 }}
        onChange={onSearch}
        autoFocus={open}
        defaultValue={searchText}
        placeholder={t("placeholder.search_blocks")}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchText ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear"
                onClick={() => {
                  onSearch("");
                }}
              >
                <BackspaceIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
      />
      <ScopeToggle
        value={scope}
        onChange={(_, v) => setScope(v as SearchScope)}
        aria-label="search-scope"
        variant="fullWidth"
      >
        <Tab
          value="current"
          icon={<ManageSearchIcon />}
          iconPosition="start"
          label={t("label.current_flow")}
        />
        <Tab
          value="all"
          icon={<TravelExploreIcon />}
          iconPosition="start"
          label={t("label.all_flows")}
        />
      </ScopeToggle>
      <Divider />
      <PanelBody>
        {loading ? (
          <Box p={2} display="grid" gap={1}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Box
                key={i}
                display="flex"
                alignItems="center"
                gap={2}
                height={56}
              >
                {/* Avatar skeleton */}
                <Skeleton variant="circular" width={32} height={32} />
                {/* Text content skeleton */}
                <Box flex={1} display="flex" flexDirection="column" gap={0.5}>
                  <Skeleton variant="text" width="90%" height={20} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : visibleSearchItems.length === 0 && searchText ? (
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
                {visibleCount} / {searchText ? backendResults.length : 0}{" "}
                {t("label.results_count")}
              </Typography>
            </ResultCount>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "auto",
              }}
            >
              <Box>
                {visibleSearchItems.slice(0, visibleCount).map((res, idx) => {
                  const item = res.item;
                  const isActive = idx === selectedIndex;

                  return (
                    <BlockSearchResultItem
                      key={item?.id ?? idx}
                      item={item}
                      isActive={isActive}
                      onClick={() => activate(idx)}
                    />
                  );
                })}
              </Box>
            </Box>
          </>
        )}
      </PanelBody>
      {(visibleSearchItems.length || 0) > shownCount ? (
        <Box p={1} display="flex" justifyContent="center">
          <Button
            size="small"
            onClick={() => {
              setShownCount((prev) => prev + MAX_ITEMS_PER_PAGE);
              setSelectedIndex(shownCount);
            }}
          >
            {t("button.show_more")}
          </Button>
        </Box>
      ) : null}
    </Panel>
  );
};

export default BlockSearchPanel;
