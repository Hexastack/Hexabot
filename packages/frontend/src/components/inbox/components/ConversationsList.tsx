/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Conversation, ConversationList } from "@chatscope/chat-ui-kit-react";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import { Chip, debounce, Grid } from "@mui/material";
import { useEffect } from "react";

import { useAppRouter } from "@/hooks/useAppRouter";
import { useTranslate } from "@/hooks/useTranslate";
import { Title } from "@/layout/content/Title";
import { EntityType, RouterType } from "@/services/types";
import { SearchPayload } from "@/types/search.types";
import { normalizeDate } from "@/utils/date";

import { useChat } from "../hooks/ChatContext";
import { useInfiniteLiveSubscribers } from "../hooks/useInfiniteLiveSubscribers";
import { AssignedTo } from "../types";

import { Avatars } from "./Avatars";

export const SubscribersList = (props: {
  channels: string[];
  searchPayload: SearchPayload<EntityType.SUBSCRIBER>;
  assignedTo: AssignedTo;
}) => {
  const router = useAppRouter();
  const rawSubscriber = router.query.subscriber;
  const subscriber = Array.isArray(rawSubscriber)
    ? rawSubscriber.at(-1) || null
    : rawSubscriber || null;
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
  }, [subscriber]);

  return (
    <>
      <Grid padding={2}>
        <Title title={t(props.assignedTo)} icon={InboxIcon} />
      </Grid>
      {subscribers?.length > 0 ? (
        <ConversationList
          scrollable={false}
          loading={isFetching}
          loadingMore={isFetching}
          onScroll={({ target }) => {
            const container = target as HTMLDivElement;

            if (
              container.scrollTop + container.clientHeight >=
              container.scrollHeight
            ) {
              handleLoadMore();
            }
          }}
        >
          {subscribers.map((subscriber) => (
            <Conversation
              onClick={() => {
                chat.setSubscriberId(subscriber.id);

                router.push({
                  pathname: `/${RouterType.INBOX}/subscribers/${subscriber.id}`,
                });
              }}
              className="changeColor"
              key={subscriber.id}
              active={chat.subscriber?.id === subscriber.id}
            >
              {Avatars({ subscriber })}
              <Conversation.Content>
                <div>
                  {subscriber.firstName} {subscriber.lastName}
                </div>
                <div className="cs-conversation__info">
                  {normalizeDate(i18n.language, subscriber.lastvisit)}
                </div>
              </Conversation.Content>
              <Conversation.Operations visible>
                <Chip size="small" label={subscriber.channel.name} />
              </Conversation.Operations>
            </Conversation>
          ))}
        </ConversationList>
      ) : (
        <Grid p={1} color="gray" textAlign="center">
          {t("message.no_result_found")}
        </Grid>
      )}
    </>
  );
};
