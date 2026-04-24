/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React from "react";

import { useChat } from "../providers/ChatProvider";
import { Suggestion, Web } from "../types/message.types";

import "./Suggestions.scss";

const Suggestions: React.FC = () => {
  const { send, suggestions } = useChat();
  const visibleSuggestions = suggestions.filter(
    (suggestion) =>
      typeof suggestion.text === "string" && suggestion.text.trim().length > 0,
  );
  const sendSuggestion = (
    event: React.MouseEvent<HTMLButtonElement>,
    suggestion: Suggestion,
  ) => {
    send({
      event,
      source: "quick-reply",
      data: {
        type: Web.InboundMessageType.quick_reply,
        data: suggestion,
      },
    });
  };

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="hb-suggestions-row">
      {visibleSuggestions.map((suggestion, idx) => (
        <button
          key={idx}
          className="hb-suggestions-element"
          onClick={(event) => sendSuggestion(event, suggestion)}
        >
          {suggestion.text}
        </button>
      ))}
    </div>
  );
};

export default Suggestions;
