/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React from "react";

import { useChat } from "../providers/ChatProvider";
import { useColors } from "../providers/ColorProvider";
import { useSettings } from "../providers/SettingsProvider";
import { ISuggestion, TOutgoingMessageType } from "../types/message.types";

import "./Suggestions.scss";

const Suggestions: React.FC = () => {
  const { setPayload, send, suggestions } = useChat();
  const settings = useSettings();
  const { colors } = useColors();
  const sendSuggestion = (
    event: React.MouseEvent<HTMLButtonElement>,
    suggestion: ISuggestion,
  ) => {
    setPayload(suggestion);
    send({
      event,
      source: "quick-reply",
      data: {
        type: TOutgoingMessageType.quick_reply,
        data: suggestion,
      },
    });
    if (settings.autoFlush) {
      setPayload(null);
    }
  };

  return (
    <div
      className="sc-suggestions-row"
      style={{ background: colors.button.bg }}
    >
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          className="sc-suggestions-element"
          onClick={(event) => sendSuggestion(event, suggestion)}
          style={{ borderColor: colors.button.text, color: colors.button.text }}
        >
          {suggestion.text}
        </button>
      ))}
    </div>
  );
};

export default Suggestions;
