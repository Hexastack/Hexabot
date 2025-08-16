/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import Autolinker from "autolinker";
import { ReactNode } from "react";

/**
 * Highlights all matches of searchTerm in text, preserving links via Autolinker.
 * @param text The original message text
 * @param searchTerm The search term to highlight
 * @param matchPositions Array of {start, end} for each match
 * @param currentMatchInMessageIndex Index of the current match within this message (-1 if none)
 */
export function highlightSearchText(
  text: string,
  searchTerm: string,
  matchPositions: { start: number; end: number }[] = [],
  currentMatchInMessageIndex: number = -1,
): ReactNode {
  if (!searchTerm || matchPositions.length === 0) {
    // Fallback to Autolinker only
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: Autolinker.link(text, {
            className: "chat-link",
            newWindow: true,
            truncate: { length: 50, location: "middle" },
            stripPrefix: false,
            sanitizeHtml: true,
          }),
        }}
      />
    );
  }

  let lastIndex = 0;
  const elements: ReactNode[] = [];
  const sortedMatches = [...matchPositions].sort((a, b) => a.start - b.start);

  sortedMatches.forEach((match, idx) => {
    // Add text before match
    if (match.start > lastIndex) {
      const beforeText = text.slice(lastIndex, match.start);

      elements.push(
        <span
          key={`before-${idx}`}
          dangerouslySetInnerHTML={{
            __html: Autolinker.link(beforeText, {
              className: "chat-link",
              newWindow: true,
              truncate: { length: 50, location: "middle" },
              stripPrefix: false,
              sanitizeHtml: true,
            }),
          }}
        />,
      );
    }
    // Add highlighted match
    const matchText = text.slice(match.start, match.end);
    const isCurrentMatch = idx === currentMatchInMessageIndex;

    elements.push(
      <mark
        key={`match-${idx}`}
        className={`search-highlight${isCurrentMatch ? " current-match" : ""}`}
        style={{
          backgroundColor: isCurrentMatch ? "#ff6b35" : "#ffeb3b",
          color: isCurrentMatch ? "white" : "black",
          padding: "1px 2px",
          borderRadius: "2px",
        }}
      >
        {matchText}
      </mark>,
    );
    lastIndex = match.end;
  });

  // Add remaining text after last match
  if (lastIndex < text.length) {
    const afterText = text.slice(lastIndex);

    elements.push(
      <span
        key="after"
        dangerouslySetInnerHTML={{
          __html: Autolinker.link(afterText, {
            className: "chat-link",
            newWindow: true,
            truncate: { length: 50, location: "middle" },
            stripPrefix: false,
            sanitizeHtml: true,
          }),
        }}
      />,
    );
  }

  return <>{elements}</>;
}
