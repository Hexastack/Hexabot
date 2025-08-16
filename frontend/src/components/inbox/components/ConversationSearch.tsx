/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Search } from "@chatscope/chat-ui-kit-react";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { Box, IconButton, Typography } from "@mui/material";
import React, { useRef } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { useConversationSearchContext } from "../hooks/ConversationSearchContext";

interface ConversationSearchProps {
  isFetchingNextPage?: boolean;
}

export const ConversationSearch: React.FC<ConversationSearchProps> = ({
  isFetchingNextPage,
}) => {
  const {
    searchTerm,
    searchResults,
    individualMatches,
    currentMatchIndex,
    isLoadingAllMessages,
    setSearchTerm,
    searchMessages,
    goToNextMatch,
    goToPrevMatch,
    clearSearch,
    toggleSearch,
  } = useConversationSearchContext();
  const { t } = useTranslate();
  // Debounce search input
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      searchMessages(value);
    }, 300);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      goToNextMatch();
    } else if (e.key === "Escape") {
      handleClose();
    }
  };
  const handleClose = () => {
    clearSearch();
    toggleSearch();
  };
  const isLoading = isLoadingAllMessages || (isFetchingNextPage ?? false);
  const { hasNextPage } = useConversationSearchContext();
  const allMessagesLoaded = !hasNextPage;

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1}
      sx={{ padding: 1, width: "100%" }}
    >
      <Search
        placeholder={t("placeholder.conversation_search")}
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClearClick={handleClose}
        autoFocus
        style={{ flex: 1, width: "100%" }}
        disabled={isLoading || !allMessagesLoaded}
      />
      {isLoading && (
        <Typography
          variant="body2"
          color="primary"
          sx={{ minWidth: "fit-content" }}
        >
          {t("message.loading_messages")}
        </Typography>
      )}
      {!isLoading && searchTerm && searchResults.length === 0 && (
        <Typography
          variant="body2"
          color="error"
          sx={{ minWidth: "fit-content" }}
        >
          {t("message.conversation_search.no_match_found")}
        </Typography>
      )}
      {!isLoading && searchResults.length > 0 && (
        <Typography variant="body2" sx={{ minWidth: "fit-content" }}>
          {currentMatchIndex + 1} of {individualMatches.length}
        </Typography>
      )}
      <IconButton
        size="small"
        onClick={goToPrevMatch}
        disabled={individualMatches.length === 0 || isLoading}
      >
        <ArrowUpwardIcon />
      </IconButton>
      <IconButton
        size="small"
        onClick={goToNextMatch}
        disabled={individualMatches.length === 0 || isLoading}
      >
        <ArrowDownwardIcon />
      </IconButton>
    </Box>
  );
};
