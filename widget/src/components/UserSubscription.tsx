/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import React, { SyntheticEvent, useCallback, useEffect, useState } from 'react';

import { useTranslation } from '../hooks/useTranslation';
import { useChat } from '../providers/ChatProvider';
import { useColors } from '../providers/ColorProvider';
import { useConfig } from '../providers/ConfigProvider';
import { useSettings } from '../providers/SettingsProvider';
import { useSocket } from '../providers/SocketProvider';
import './UserSubscription.scss';
import { useWidget } from '../providers/WidgetProvider';
import {
  Direction,
  ISubscriber,
  TMessage,
  TOutgoingMessageType,
} from '../types/message.types';

const UserSubscription: React.FC = () => {
  const config = useConfig();
  const { t } = useTranslation();
  const { colors } = useColors();
  const { socket } = useSocket();
  const settings = useSettings();
  const { setScreen } = useWidget();
  const {
    send,
    setMessages,
    setConnectionState,
    participants,
    setParticipants,
  } = useChat();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const handleSubmit = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      try {
        setConnectionState(2);
        const { body } = await socket.get<{
          messages: TMessage[];
          profile: ISubscriber;
        }>(
          `/webhook/${config.channel}/?verification_token=${config.token}&first_name=${firstName}&last_name=${lastName}`,
        );
        const { messages, profile } = body;

        localStorage.setItem('profile', JSON.stringify(profile));
        messages.forEach((message) => {
          const direction =
            message.author === profile.foreign_id ||
            message.author === profile.id
              ? Direction.sent
              : Direction.received;

          message.direction = direction;
          if (message.direction === Direction.sent) {
            message.read = true;
            message.delivery = false;
          }
        });
        setMessages(messages);
        setParticipants([
          ...participants,
          {
            id: profile.foreign_id,
            foreign_id: profile.foreign_id,
            name: `${profile.first_name} ${profile.last_name}`,
          },
        ]);

        if (messages.length === 0) {
          send({
            event: event as SyntheticEvent,
            source: 'get_started_button',
            data: {
              type: TOutgoingMessageType.postback,
              data: {
                text: 'GET_STARTED', //TODO:use translation here?
                payload: 'GET_STARTED',
              },
              author: profile.foreign_id,
            },
          });
        }
        setConnectionState(3);
        setScreen('chat');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Unable to subscribe user', e);
        setScreen('prechat');
        setConnectionState(0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      firstName,
      lastName,
      participants,
      setConnectionState,
      setMessages,
      setParticipants,
      setScreen,
      socket,
    ],
  );

  useEffect(() => {
    const profile = localStorage.getItem('profile');

    if (profile) {
      const parsedProfile = JSON.parse(profile);

      setFirstName(parsedProfile.first_name);
      setLastName(parsedProfile.last_name);
      handleSubmit();
    }
  }, [handleSubmit, setScreen]);

  return (
    <div className="user-subscription-wrapper">
      <form className="user-subscription" onSubmit={handleSubmit}>
        <div className="user-subscription-title">
          {settings.greetingMessage}
        </div>
        <div className="user-subscription-form">
          <input
            className="user-subscription-form-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('user_subscription.first_name')}
            required
          />
          <input
            className="user-subscription-form-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('user_subscription.last_name')}
            required
          />
          <button
            type="submit"
            style={{ background: colors.header.bg, color: colors.header.text }}
            className="user-subscription-form-button-submit"
          >
            {t('user_subscription.get_started')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserSubscription;
