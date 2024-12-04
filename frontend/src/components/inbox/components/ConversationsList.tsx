/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Avatar,
  Conversation,
  ConversationList,
} from '@chatscope/chat-ui-kit-react';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import { Chip, debounce, Grid } from '@mui/material';

import { useConfig } from '@/hooks/useConfig';
import { useTranslate } from '@/hooks/useTranslate';
import { Title } from '@/layout/content/Title';
import { EntityType } from '@/services/types';

import { getAvatarSrc } from '../helpers/mapMessages';
import { useChat } from '../hooks/ChatContext';
import { useInfiniteLiveSubscribers } from '../hooks/useInfiniteLiveSubscribers';
import { AssignedTo } from '../types';

export const SubscribersList = (props: {
  channels: string[];
  searchPayload: any;
  assignedTo: AssignedTo;
}) => {
  const { apiUrl } = useConfig();
  const { t, i18n } = useTranslate();
  const chat = useChat();
  const { fetchNextPage, isFetching, subscribers, hasNextPage } =
    useInfiniteLiveSubscribers(props);
  const handleLoadMore = debounce(() => {
    !isFetching && hasNextPage && fetchNextPage();
  }, 400);

  return (
    <>
      <Grid padding={2}>
        <Title title={t(props.assignedTo)} icon={InboxIcon} />
      </Grid>
      {subscribers?.length > 0 && (
        <ConversationList
          scrollable
          loading={isFetching}
          loadingMore={isFetching}
          onYReachEnd={handleLoadMore}
        >
          {subscribers.map((conversation) => (
            <Conversation
              onClick={() => chat.setSubscriberId(conversation.id)}
              className="changeColor"
              key={conversation.id}
              active={chat.subscriber?.id === conversation.id}
            >
              <Avatar
                src={getAvatarSrc(
                  apiUrl,
                  EntityType.SUBSCRIBER,
                  conversation.foreign_id,
                )}
              />
              <Conversation.Content>
                <div>
                  {conversation.first_name} {conversation.last_name}
                </div>
                <div className="cs-conversation__info">
                  {conversation.lastvisit?.toLocaleString(i18n.language)}
                </div>
              </Conversation.Content>
              <Conversation.Operations visible>
                <Chip size="small" label={conversation.channel.name} />
              </Conversation.Operations>
            </Conversation>
          ))}
        </ConversationList>
      )}
    </>
  );
};
