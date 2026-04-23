/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Check } from "lucide-react";
import React from "react";

import { UiMessage } from "../types/message.types";

import "./MessageStatus.scss";

interface MessageStatusProps {
  message: UiMessage;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ message }) => {
  if (!("delivery" in message && "read" in message)) {
    throw new Error("Unable to find delivery/read attributes");
  }

  return (
    <div className="hb--status">
      {message.read && (
        <div className="hb--status-wrapper hb--status-read" title="Read">
          <Check
            width="16px"
            height="16px"
            className="read check"
          />
        </div>
      )}
      {message.delivery && (
        <div
          className="hb--status-wrapper hb--status-delivery"
          title="Delivered"
        >
          <Check
            width="16px"
            height="16px"
            className="delivery check"
          />
        </div>
      )}
    </div>
  );
};

export default MessageStatus;
