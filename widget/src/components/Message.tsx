/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { PropsWithChildren, useState } from 'react';

import ChatIcon from './icons/ChatIcon';
import ButtonsMessage from './messages/ButtonMessage';
import CarouselMessage from './messages/CarouselMessage';
import FileMessage from './messages/FileMessage';
import GeolocationMessage from './messages/GeolocationMessage';
import ListMessage from './messages/ListMessage';
import TextMessage from './messages/TextMessage';
import MessageStatus from './MessageStatus';
import { useChat } from '../providers/ChatProvider';
import { useColors } from '../providers/ColorProvider';
import { TMessage } from '../types/message.types';
import './Message.scss';

dayjs.extend(relativeTime);

type MessageProps = PropsWithChildren<{
  Avatar?: () => JSX.Element;
  message: TMessage;
}>;

const Message: React.FC<MessageProps> = ({ message, Avatar }) => {
  const { participants } = useChat();
  const { colors } = useColors();
  const [isTimeVisible, setIsTimeVisible] = useState(false);
  const user = participants.find(
    (participant) => participant.id === message.author,
  ) || {
    id: 'me',
    name: 'Anon',
  };
  const handleTime = () => {
    setIsTimeVisible(!isTimeVisible);
  };
  const fromNow = (time: string) => {
    return dayjs(time).fromNow();
  };

  return (
    <div className={`sc-message ${message.direction}`}>
      <div className={`sc-message--content ${message.direction}`}>
        <div
          title={user.name}
          className="sc-message--avatar"
          style={
            user.imageUrl
              ? { backgroundImage: `url(${user.imageUrl})` }
              : undefined
          }
        >
          {Avatar ? (
            <Avatar />
          ) : !user.imageUrl ? (
            <ChatIcon width="32px" height="32px" />
          ) : null}
        </div>
        <div className="sc-message--wrapper" onClick={handleTime}>
          {message.data && 'text' in message.data && (
            <TextMessage message={message} />
          )}
          {message.type === 'file' && <FileMessage message={message} />}
          {message.type === 'location' && (
            <GeolocationMessage message={message} />
          )}
          {message.type === 'list' && <ListMessage messageList={message} />}
          {message.type === 'carousel' && (
            <CarouselMessage messageCarousel={message} />
          )}
          {message.type === 'buttons' && <ButtonsMessage message={message} />}

          <div className="sc-message--meta">
            {message.direction === 'sent' && (
              <MessageStatus message={message} />
            )}
            <div
              style={{ color: colors.messageTime.text }}
              className="sc-message--time"
            >
              {isTimeVisible && fromNow(message.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
