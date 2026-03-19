/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import debounce from "@mui/utils/debounce";
import { Inbox } from "lucide-react";
import { UIEventHandler, useCallback, useEffect } from "react";

import { useAppRouter } from "@/hooks/useAppRouter";
import { useTranslate } from "@/hooks/useTranslate";
import { Title } from "@/layout/content/Title";
import { EntityType, RouterType } from "@/services/types";
import { SearchPayload } from "@/types/search.types";
import { normalizeDate } from "@/utils/date";

import { useChat } from "../hooks/ChatContext";
import { useInfiniteLiveSubscribers } from "../hooks/useInfiniteLiveSubscribers";
import { AssignedTo } from "../types";

import { SubscriberAvatars } from "./SubscriberAvatars";

export const ConversationsList = (props: {
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
  const handleScroll: UIEventHandler<HTMLUListElement> = useCallback(
    (event) => {
      const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;

      if (Math.ceil(scrollTop + clientHeight) >= scrollHeight) {
        handleLoadMore();
      }
    },
    [handleLoadMore],
  );

  return (
    <List
      onScroll={handleScroll}
      sx={{
        height: "100%",
        overflow: "auto",
        p: 2,
      }}
      subheader={
        <ListSubheader component="div">
          <Title title={t(props.assignedTo)} Icon={Inbox} />
        </ListSubheader>
      }
    >
      {subscribers?.map((sub) => (
        <ListItem disablePadding key={sub.id} sx={{ mt: 0.5 }}>
          <ListItemButton
            selected={chat.subscriber?.id === sub.id}
            onClick={() => {
              chat.setSubscriberId(sub.id);
              router.push(`/${RouterType.INBOX}/subscribers/${sub.id}`);
            }}
          >
            <ListItemAvatar>
              <SubscriberAvatars subscriber={sub} />
            </ListItemAvatar>
            <ListItemText
              primary={sub.fullName}
              secondary={normalizeDate(i18n.language, sub.lastvisit)}
              primaryTypographyProps={{
                variant: "body2",
              }}
              secondaryTypographyProps={{
                variant: "caption",
              }}
            />
            <Chip size="small" label={sub.channel.name} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};
