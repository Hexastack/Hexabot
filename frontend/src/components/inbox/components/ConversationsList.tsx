/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Conversation, ConversationList } from "@chatscope/chat-ui-kit-react";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import { Chip, debounce, Grid } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { Title } from "@/layout/content/Title";
import { RouterType } from "@/services/types";
import { SearchPayload } from "@/types/search.types";
import { ISubscriber } from "@/types/subscriber.types";
import { normalizeDate } from "@/utils/date";

import { useChat } from "../hooks/ChatContext";
import { useInfiniteLiveSubscribers } from "../hooks/useInfiniteLiveSubscribers";
import { AssignedTo } from "../types";

import { Avatars } from "./Avatars";

export const SubscribersList = (props: {
  channels: string[];
  searchPayload: SearchPayload<ISubscriber>;
  assignedTo: AssignedTo;
}) => {
  const router = useRouter();
  const subscriber = router.query.subscriber?.toString() || null;
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
                router.push(
                  {
                    pathname: `/${RouterType.INBOX}/subscribers/[subscriber]`,
                    query: {
                      ...router.query,
                      subscriber: subscriber.id,
                    },
                  },
                  undefined,
                  { shallow: true },
                );
              }}
              className="changeColor"
              key={subscriber.id}
              active={chat.subscriber?.id === subscriber.id}
            >
              {Avatars({ subscriber })}
              <Conversation.Content>
                <div>
                  {subscriber.first_name} {subscriber.last_name}
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
