/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import BackspaceIcon from "@mui/icons-material/Backspace";
import CloseIcon from "@mui/icons-material/Close";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import SearchIcon from "@mui/icons-material/Search";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import { styled } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useRouter } from "next/router";
import { RefObject, useCallback, useState } from "react";
import { FixedSizeList } from "react-window";

import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { NoDataOverlay } from "@/app-components/tables/NoDataOverlay";
import { useFind } from "@/hooks/crud/useFind";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, RouterType } from "@/services/types";
import { IBlockSearchResult } from "@/types/block.types";

import { BlockSearchResultItem } from "./BlockSearchResultItem";
import { useVisualEditor } from "./hooks/useVisualEditor";

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
  const router = useRouter();
  const { t } = useTranslate();
  const { toast } = useToast();
  const [scope, setScope] = useState<SearchScope>("all");
  const blockId = router.query.blockId?.toString();
  const [selected, setSelected] = useState<string | undefined>(blockId);
  const { selectedCategoryId } = useVisualEditor();
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
        setSelected(undefined);
      },
      onError() {
        toast.error(t("message.failed_to_load_blocks"));
      },
    },
  );
  const loading = isLoading || isFetching;
  const navigateToBlock = useCallback(
    async (blockId: string, categoryId: string) => {
      // Navigate to route embedding block id (or only flow if block missing)
      if (categoryId && blockId) {
        await router.push(
          `/${RouterType.VISUAL_EDITOR}/flows/${categoryId}/${blockId}`,
        );
      }
    },
    [router],
  );
  const selectSearchResult = useCallback(
    async (item: IBlockSearchResult) => {
      if (!item) return;

      setSelected(item.id);
      await navigateToBlock(item.id, item.category);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigateToBlock],
  );

  return (
    <Panel
      open={open}
      onClose={(_event, reason) => {
        if (reason === "backdropClick") return; // ignore outside clicks
        onClose();
      }}
      hideBackdrop
      container={canvasRef?.current}
      PaperProps={{
        sx: {
          height: "calc(100% - 256px)",
          width: "100%",
          margin: 0,
        },
      }}
    >
      <DialogTitle>{t("label.search_blocks_panel_header")}</DialogTitle>
      <IconButton
        aria-label={t("button.close")}
        onClick={onClose}
        sx={(theme) => ({
          position: "absolute",
          right: 5,
          top: 5,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
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
        ) : null}

        {blockSearchResults.length === 0 && searchText ? (
          <NoDataOverlay i18nKey="message.no_matching_results" />
        ) : null}

        {blockSearchResults.length > 0 && searchText ? (
          <FixedSizeList
            height={56 * 7} // display 5 results at once
            width="100%"
            itemCount={blockSearchResults.length}
            itemSize={56}
            itemData={{
              items: blockSearchResults,
              selected,
              onClick: selectSearchResult,
            }}
          >
            {BlockSearchResultItem}
          </FixedSizeList>
        ) : null}
      </DialogContent>
    </Panel>
  );
};
