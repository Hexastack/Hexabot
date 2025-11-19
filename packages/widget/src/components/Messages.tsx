/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import React, { PropsWithChildren, useEffect, useRef, useState } from "react";

import { useChat } from "../providers/ChatProvider";
import { useColors } from "../providers/ColorProvider";
import { useWidget } from "../providers/WidgetProvider";
import { TMessage } from "../types/message.types";

import Message from "./Message";
import "./Messages.scss";
import TypingMessage from "./messages/TypingMessage";

type MessagesProps = PropsWithChildren<{
  Avatar?: () => JSX.Element;
}>;

const Messages: React.FC<MessagesProps> = ({ Avatar }) => {
  const { scroll, setScroll, isOpen } = useWidget();
  const { messages, showTypingIndicator, setNewIOMessage } = useChat();
  const { colors } = useColors();
  const scrollListRef = useRef<HTMLDivElement>(null);
  const [lastReceivedMessage, setLastReceivedMessage] = useState<
    TMessage | undefined
  >();

  useEffect(() => {
    const scrollTo = (scroll: number) => {
      if (scrollListRef.current) {
        const scrollPercent = Math.round(
          (100 * scrollListRef.current.scrollTop) /
            (scrollListRef.current.scrollHeight || 1),
        );

        if (Math.abs(scrollPercent - scroll) > 1 || scroll === 100) {
          requestAnimationFrame(() => {
            if (scrollListRef.current) {
              scrollListRef.current.scrollTo({
                top: Math.round(
                  (scroll * scrollListRef.current.scrollHeight) / 100,
                ),
                behavior: "instant",
                left: 0,
              });
            }
          });
        }
      }
    };

    if (isOpen) {
      setTimeout(() => {
        scrollTo(scroll);
      }, 100);
    }
  }, [scroll, isOpen, messages.length]);

  useEffect(() => {
    setNewIOMessage(messages[messages.length - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const newestReceivedMessage = messages[messages.length - 1];

    if (lastReceivedMessage !== newestReceivedMessage) {
      setLastReceivedMessage(newestReceivedMessage);
      setScroll(100);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  return (
    <div
      className="sc-message-list"
      ref={scrollListRef}
      style={{ backgroundColor: colors.messageList.bg }}
    >
      {messages.map((message) => (
        <Message key={message.mid} message={message} Avatar={Avatar} />
      ))}
      {showTypingIndicator && <TypingMessage />}
    </div>
  );
};

export default Messages;
