/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React from "react";

import { useColors } from "../providers/ColorProvider";
import { TMessage } from "../types/message.types";

import CheckIcon from "./icons/CheckIcon";
import "./MessageStatus.scss";

interface MessageStatusProps {
  message: TMessage;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ message }) => {
  const { colors } = useColors();

  if (!("delivery" in message && "read" in message)) {
    throw new Error("Unable to find delivery/read attributes");
  }

  return (
    <div className="sc--status" style={{ color: colors.messageStatus.bg }}>
      {message.read && (
        <div className="sc--status-wrapper sc--status-read" title="Read">
          <CheckIcon
            width="16px"
            height="16px"
            className="read check"
            style={{ stroke: colors.messageStatus.bg }}
          />
        </div>
      )}
      {message.delivery && (
        <div
          className="sc--status-wrapper sc--status-delivery"
          title="Delivered"
        >
          <CheckIcon
            width="16px"
            height="16px"
            className="delivery check"
            style={{ stroke: colors.messageStatus.bg }}
          />
        </div>
      )}
    </div>
  );
};

export default MessageStatus;
