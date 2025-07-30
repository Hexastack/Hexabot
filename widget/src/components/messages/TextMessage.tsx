/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import Autolinker from "autolinker";
import React, { useEffect, useRef } from "react";

import { useColors } from "../../providers/ColorProvider";
import { Direction, TMessage } from "../../types/message.types";

import "./TextMessage.scss";

interface TextMessageProps {
  message: TMessage;
}

const TextMessage: React.FC<TextMessageProps> = ({ message }) => {
  const { colors: allColors } = useColors();
  const messageTextRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    autoLink();
  }, [message]);

  const autoLink = () => {
    if (messageTextRef.current) {
      const text = messageTextRef.current.innerText;

      messageTextRef.current.innerHTML = Autolinker.link(text, {
        className: "chatLink",
        truncate: { length: 50, location: "smart" },
        sanitizeHtml: true,
      });
    }
  };

  if (!("text" in message.data)) {
    throw new Error("Unable to find text.");
  }

  const colors = allColors[message.direction || Direction.received];

  return (
    <div
      className="sc-message--text"
      style={{
        color: colors.text,
        backgroundColor: colors.bg,
        ["--launcher-color" as string]: colors.hover,
      }}
    >
      <p className="sc-message--text-content" ref={messageTextRef}>
        {message.data.text}
      </p>
    </div>
  );
};

export default TextMessage;
