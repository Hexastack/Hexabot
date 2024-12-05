/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
