/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { IMessage } from "@/types/message.types";

export interface SearchResult {
  messageId: string;
  messageIndex: number;
  matchPositions: { start: number; end: number }[];
  originalText: string;
}

// Individual match for navigation
export interface IndividualMatch {
  messageId: string;
  messageIndex: number;
  matchIndex: number; // Index within the message's matches
  matchPosition: { start: number; end: number };
  originalText: string;
}

interface ConversationSearchState {
  searchTerm: string;
  searchResults: SearchResult[]; // Grouped by message
  individualMatches: IndividualMatch[]; // Flattened individual matches
  currentMatchIndex: number; // Index in individualMatches array
  isSearchActive: boolean;
  isLoadingAllMessages: boolean; // Loading state for fetching all messages
}

export const useConversationSearch = (
  messages: IMessage[],
  fetchAllMessages?: () => Promise<void>,
  hasNextPage?: boolean,
) => {
  const [searchState, setSearchState] = useState<ConversationSearchState>({
    searchTerm: "",
    searchResults: [],
    individualMatches: [],
    currentMatchIndex: -1,
    isSearchActive: false,
    isLoadingAllMessages: false,
  });
  // Memoize search results based on messages and search term
  const getSearchResults = useMemo(() => {
    const term = searchState.searchTerm;

    if (!term.trim() || !searchState.isSearchActive) {
      return {
        results: [],
        individualMatches: [],
      };
    }

    const results: SearchResult[] = [];
    const individualMatches: IndividualMatch[] = [];
    const normalizedSearchTerm = term.toLowerCase();

    messages.forEach((message, index) => {
      if (
        message.message &&
        "text" in message.message &&
        message.message.text
      ) {
        const originalText = message.message.text;
        const text = originalText.toLowerCase();
        const matchPositions: { start: number; end: number }[] = [];
        let searchIndex = 0;

        while (true) {
          const foundIndex = text.indexOf(normalizedSearchTerm, searchIndex);

          if (foundIndex === -1) break;

          const matchPosition = {
            start: foundIndex,
            end: foundIndex + normalizedSearchTerm.length,
          };

          matchPositions.push(matchPosition);

          // Add to individual matches for navigation
          individualMatches.push({
            messageId: message.id,
            messageIndex: index,
            matchIndex: matchPositions.length - 1, // 0-based index within this message
            matchPosition,
            originalText,
          });

          searchIndex = foundIndex + 1;
        }
        if (matchPositions.length > 0) {
          results.push({
            messageId: message.id,
            messageIndex: index,
            matchPositions,
            originalText,
          });
        }
      }
    });

    return {
      results,
      individualMatches,
    };
  }, [messages, searchState.searchTerm, searchState.isSearchActive]);

  // Update search state when results change
  useEffect(() => {
    if (searchState.isSearchActive && searchState.searchTerm.trim()) {
      const { results, individualMatches } = getSearchResults;

      setSearchState((prev) => {
        // Only reset currentMatchIndex if search term changed or results are empty
        let newIndex = prev.currentMatchIndex;

        if (individualMatches.length === 0) {
          newIndex = -1;
        } else if (
          prev.currentMatchIndex < 0 ||
          prev.currentMatchIndex >= individualMatches.length
        ) {
          newIndex = 0;
        }

        return {
          ...prev,
          searchResults: results,
          individualMatches,
          currentMatchIndex: newIndex,
        };
      });
    }
  }, [getSearchResults, searchState.isSearchActive, searchState.searchTerm]);

  // Function to trigger search with a new term
  const searchMessages = useCallback((term: string) => {
    if (!term.trim()) {
      setSearchState((prev) => ({
        ...prev,
        searchResults: [],
        individualMatches: [],
        currentMatchIndex: -1,
      }));

      return;
    }

    // Just update the search term, the effect will handle updating results
    setSearchState((prev) => ({
      ...prev,
      searchTerm: term,
    }));
  }, []);
  const goToNextMatch = useCallback(() => {
    setSearchState((prev) => {
      if (prev.individualMatches.length === 0) return prev;

      const nextIndex =
        prev.currentMatchIndex < prev.individualMatches.length - 1
          ? prev.currentMatchIndex + 1
          : 0;

      return { ...prev, currentMatchIndex: nextIndex };
    });
  }, []);
  const goToPrevMatch = useCallback(() => {
    setSearchState((prev) => {
      if (prev.individualMatches.length === 0) return prev;

      const prevIndex =
        prev.currentMatchIndex > 0
          ? prev.currentMatchIndex - 1
          : prev.individualMatches.length - 1;

      return { ...prev, currentMatchIndex: prevIndex };
    });
  }, []);
  const clearSearch = useCallback(() => {
    setSearchState({
      searchTerm: "",
      searchResults: [],
      individualMatches: [],
      currentMatchIndex: -1,
      isSearchActive: false,
      isLoadingAllMessages: false,
    });
  }, []);
  const toggleSearch = useCallback(async () => {
    setSearchState((prev) => {
      const newIsActive = !prev.isSearchActive;

      // If activating search and there are more pages to load
      if (newIsActive && hasNextPage && fetchAllMessages) {
        // Start loading all messages
        setSearchState((current) => ({
          ...current,
          isLoadingAllMessages: true,
        }));
        fetchAllMessages()
          .then(() => {
            setSearchState((current) => ({
              ...current,
              isLoadingAllMessages: false,
            }));
          })
          .catch(() => {
            setSearchState((current) => ({
              ...current,
              isLoadingAllMessages: false,
            }));
          });
      }

      return {
        ...prev,
        isSearchActive: newIsActive,
        // Reset loading state when deactivating
        isLoadingAllMessages: newIsActive ? prev.isLoadingAllMessages : false,
      };
    });
  }, [fetchAllMessages, hasNextPage]);
  const setSearchTerm = useCallback((term: string) => {
    setSearchState((prev) => ({ ...prev, searchTerm: term }));
  }, []);
  const currentMatch = useMemo(() => {
    if (
      searchState.currentMatchIndex >= 0 &&
      searchState.individualMatches.length > 0
    ) {
      // Get the current individual match
      const currentIndividualMatch =
        searchState.individualMatches[searchState.currentMatchIndex];

      // Find the corresponding message result
      return searchState.searchResults.find(
        (result) => result.messageId === currentIndividualMatch.messageId,
      );
    }

    return null;
  }, [
    searchState.currentMatchIndex,
    searchState.individualMatches,
    searchState.searchResults,
  ]);
  const isCurrentMatchMessage = useCallback(
    (messageId: string) => {
      return currentMatch?.messageId === messageId;
    },
    [currentMatch],
  );
  const getMessageSearchDetails = useCallback(
    (messageId: string) => {
      const searchResult = searchState.searchResults.find(
        (result) => result.messageId === messageId,
      );

      if (!searchResult || !searchState.searchTerm) return null;

      // Find which match in this message is the current global match
      let currentMatchInMessageIndex = -1;

      if (
        searchState.currentMatchIndex >= 0 &&
        searchState.individualMatches.length > 0
      ) {
        const currentIndividualMatch =
          searchState.individualMatches[searchState.currentMatchIndex];

        if (
          currentIndividualMatch &&
          currentIndividualMatch.messageId === messageId
        ) {
          currentMatchInMessageIndex = currentIndividualMatch.matchIndex;
        }
      }

      return {
        searchTerm: searchState.searchTerm,
        matchPositions: searchResult.matchPositions,
        currentMatchInMessageIndex,
        originalText: searchResult.originalText,
      };
    },
    [
      searchState.searchResults,
      searchState.searchTerm,
      searchState.currentMatchIndex,
      searchState.individualMatches,
    ],
  );

  return {
    searchTerm: searchState.searchTerm,
    searchResults: searchState.searchResults,
    individualMatches: searchState.individualMatches,
    currentMatchIndex: searchState.currentMatchIndex,
    isSearchActive: searchState.isSearchActive,
    isLoadingAllMessages: searchState.isLoadingAllMessages,
    currentMatch,
    setSearchTerm,
    searchMessages,
    goToNextMatch,
    goToPrevMatch,
    clearSearch,
    toggleSearch,
    isCurrentMatchMessage,
    getMessageSearchDetails,
    totalMatches: searchState.individualMatches.length, // Updated to use individual matches
    hasMatches: searchState.individualMatches.length > 0,
  };
};
