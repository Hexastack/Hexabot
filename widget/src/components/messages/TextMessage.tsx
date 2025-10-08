/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
