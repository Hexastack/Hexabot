/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Avatar,
  Conversation,
  ConversationList,
} from "@chatscope/chat-ui-kit-react";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import { Chip, debounce, Grid } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { Title } from "@/layout/content/Title";
import { EntityType, RouterType } from "@/services/types";

import { getAvatarSrc } from "../helpers/mapMessages";
import { useChat } from "../hooks/ChatContext";
import { useInfiniteLiveSubscribers } from "../hooks/useInfiniteLiveSubscribers";
import { AssignedTo } from "../types";

export const SubscribersList = (props: {
  channels: string[];
  searchPayload: any;
  assignedTo: AssignedTo;
}) => {
  const { query, push } = useRouter();
  const subscriber = query.subscriber?.toString() || null;
  const { apiUrl } = useConfig();
  const { t, i18n } = useTranslate();
  const chat = useChat();
  const { fetchNextPage, isFetching, subscribers, hasNextPage } =
    useInfiniteLiveSubscribers(props);
  const handleLoadMore = debounce(() => {
    !isFetching && hasNextPage && fetchNextPage();
  }, 400);

  useEffect(() => {
    if (chat) {
      chat.setSubscriberId(subscriber);
    }
  }, [chat, subscriber]);

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
          {subscribers.map((subscriber) => (
            <Conversation
              onClick={() => {
                chat.setSubscriberId(subscriber.id);
                push(`/${RouterType.INBOX}/subscribers/${subscriber.id}`);
              }}
              className="changeColor"
              key={subscriber.id}
              active={chat.subscriber?.id === subscriber.id}
            >
              <Avatar
                src={getAvatarSrc(apiUrl, EntityType.SUBSCRIBER, subscriber.id)}
              />
              <Conversation.Content>
                <div>
                  {subscriber.first_name} {subscriber.last_name}
                </div>
                <div className="cs-conversation__info">
                  {subscriber.lastvisit?.toLocaleString(i18n.language)}
                </div>
              </Conversation.Content>
              <Conversation.Operations visible>
                <Chip size="small" label={subscriber.channel.name} />
              </Conversation.Operations>
            </Conversation>
          ))}
        </ConversationList>
      )}
    </>
  );
};
