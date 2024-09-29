/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';

import Message from './Message';
import TypingMessage from './messages/TypingMessage';
import { useChat } from '../providers/ChatProvider';
import { useColors } from '../providers/ColorProvider';
import { useWidget } from '../providers/WidgetProvider';

import './Messages.scss';

type MessagesProps = PropsWithChildren<{
  Avatar?: () => JSX.Element;
}>;

const Messages: React.FC<MessagesProps> = ({ Avatar }) => {
  const { scroll, setScroll, isOpen } = useWidget();
  const { messages, showTypingIndicator, setNewIOMessage } = useChat();
  const { colors } = useColors();
  const scrollListRef = useRef<HTMLDivElement>(null);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const scrollPercent = Math.round(
      (100 * e.currentTarget.scrollTop) / (e.currentTarget.scrollHeight || 1),
    );

    if (!scroll && scrollPercent) {
      setScroll(scrollPercent);
    } else if (scrollPercent) {
      const id = setTimeout(() => {
        setScroll(scrollPercent);
      }, 400) as unknown as number;

      setTimeoutId(id);
    } else if (scroll) {
      setScroll(scrollPercent);
    }
  };

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
                behavior: 'instant',
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
  }, [scroll, isOpen]);

  useEffect(() => {
    setNewIOMessage(messages[messages.length - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="sc-message-list"
      ref={scrollListRef}
      style={{ backgroundColor: colors.messageList.bg }}
      onScroll={handleScroll}
    >
      {messages.map((message) => (
        <Message key={message.mid} message={message} Avatar={Avatar} />
      ))}
      {showTypingIndicator && <TypingMessage />}
    </div>
  );
};

export default Messages;
