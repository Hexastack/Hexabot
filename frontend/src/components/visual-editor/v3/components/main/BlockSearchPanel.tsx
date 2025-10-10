/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import BackspaceIcon from "@mui/icons-material/Backspace";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import SearchIcon from "@mui/icons-material/Search";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import { styled } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { RefObject, useCallback, useEffect, useState } from "react";
import { FixedSizeList } from "react-window";

import { DialogTitle } from "@/app-components/dialogs";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { NoDataOverlay } from "@/app-components/tables/NoDataOverlay";
import { useFind } from "@/hooks/crud/useFind";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";

import {
  BLOCK_SEARCH_RESULT_ITEM_HEIGHT,
  BlockSearchResultItem,
} from "../../../components/BlockSearchResultItem";
import { useVisualEditor } from "../../hooks/useVisualEditor";

export type SearchScope = "current" | "all";

const Panel = styled(Dialog)(() => ({
  position: "absolute",
  bottom: "auto",
  left: "auto",
  marginTop: "24px",
  marginRight: "24px",
  width: 420,
}));
const ScopeToggle = styled(Tabs)(() => ({
  minHeight: 36,
  "& .MuiTab-root": {
    minHeight: 36,
  },
}));
const ResultCount = styled(Box)(() => ({ padding: "4px 16px", color: "#555" }));
const VISIBLE_BLOCK_SEARCH_RESULTS = 7;

export interface BlockSearchPanelProps {
  open: boolean;
  onClose: () => void;
  canvasRef: RefObject<HTMLDivElement>;
}

export const BlockSearchPanel: React.FC<BlockSearchPanelProps> = ({
  open,
  onClose,
  canvasRef,
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const [scope, setScope] = useState<SearchScope>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { selectedCategoryId, setOpenSearchPanel, updateVisualEditorURL } =
    useVisualEditor();
  const { onSearch, searchText } = useSearch<EntityType.BLOCK_SEARCH>({});
  const {
    data: blockSearchResults = [],
    isLoading,
    isFetching,
  } = useFind(
    { entity: EntityType.BLOCK_SEARCH },
    {
      hasCount: false,
      params: {
        q: searchText,
        category: scope === "current" ? selectedCategoryId : undefined,
        limit: 200,
      },
    },
    {
      enabled: open && Boolean(searchText && searchText.trim().length > 0),
      onSuccess() {
        setSelectedIndex(0);
      },
      onError() {
        toast.error(t("message.failed_to_load_blocks"));
      },
    },
  );
  const isLoadingResults = isLoading || isFetching;

  useEffect(() => {
    setOpenSearchPanel(open);
  }, [open, setOpenSearchPanel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(
          Math.min(selectedIndex + 1, blockSearchResults.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
      }
    },
    [blockSearchResults.length, selectedIndex],
  );

  return (
    <Panel
      open={open}
      onClose={() => {
        onClose();
      }}
      container={canvasRef?.current}
      PaperProps={{
        sx: {
          height: "calc(100% - 256px)",
          width: "100%",
          margin: 0,
        },
      }}
      onKeyDown={handleKeyDown}
    >
      <DialogTitle onClose={onClose}>
        {t("label.search_blocks_panel_header")}
      </DialogTitle>
      <DialogContent dividers>
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
        {searchText ? (
          <>
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
          </>
        ) : null}

        {isLoadingResults ? (
          <Box p={2} display="grid" gap={1}>
            {Array.from({ length: VISIBLE_BLOCK_SEARCH_RESULTS }).map(
              (_, i) => (
                <Box
                  key={i}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  height={BLOCK_SEARCH_RESULT_ITEM_HEIGHT}
                >
                  {/* Avatar skeleton */}
                  <Skeleton variant="circular" width={32} height={32} />
                  {/* Text content skeleton */}
                  <Box flex={1} display="flex" flexDirection="column" gap={0.5}>
                    <Skeleton variant="text" width="90%" height={20} />
                    <Skeleton variant="text" width="60%" height={16} />
                  </Box>
                </Box>
              ),
            )}
          </Box>
        ) : null}

        {!isLoadingResults && blockSearchResults.length === 0 && searchText ? (
          <NoDataOverlay i18nKey="message.no_matching_results" />
        ) : null}

        {!isLoadingResults && blockSearchResults.length > 0 && searchText ? (
          <>
            <ResultCount>
              <Typography variant="caption">
                {blockSearchResults.length} {t("message.results")}
              </Typography>
            </ResultCount>
            <FixedSizeList
              height={
                BLOCK_SEARCH_RESULT_ITEM_HEIGHT * blockSearchResults.length
              }
              style={{ maxHeight: "calc(100vh - 442px)" }}
              width="100%"
              itemCount={blockSearchResults.length}
              itemSize={BLOCK_SEARCH_RESULT_ITEM_HEIGHT}
              itemData={{
                items: blockSearchResults,
                selected: blockSearchResults[selectedIndex].id,
                onClick: (item) => {
                  updateVisualEditorURL(item.category, [item.id]);
                },
              }}
            >
              {BlockSearchResultItem}
            </FixedSizeList>
          </>
        ) : null}
      </DialogContent>
    </Panel>
  );
};
