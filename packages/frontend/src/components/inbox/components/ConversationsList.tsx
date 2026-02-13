/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Chip, List, MenuItem, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
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
  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(
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
      component="div"
      sx={{
        display: "flex",
        gap: 1,
        height: "100%",
        overflow: "auto",
        p: 1.5,
        pt: 0,
      }}
      subheader={
        <Grid
          sx={{
            px: 1.5,
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: "background.default",
            borderRadius: "shape.borderRadius",
          }}
        >
          <Title title={t(props.assignedTo)} Icon={Inbox} />
        </Grid>
      }
    >
      {subscribers?.map((sub) => (
        <MenuItem
          key={sub.id}
          selected={chat.subscriber?.id === sub.id}
          onClick={() => {
            chat.setSubscriberId(sub.id);
            router.push(`/${RouterType.INBOX}/subscribers/${sub.id}`);
          }}
        >
          <SubscriberAvatars subscriber={sub} />
          <Grid textAlign="left" flex={1}>
            <Typography variant="body2">{sub.fullName}</Typography>
            <Typography variant="caption">
              {normalizeDate(i18n.language, sub.lastvisit)}
            </Typography>
          </Grid>
          <Chip size="medium" label={sub.channel.name} />
        </MenuItem>
      ))}
    </List>
  );
};
