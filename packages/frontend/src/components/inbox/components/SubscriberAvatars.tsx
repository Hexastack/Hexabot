/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Avatar, AvatarGroup, styled } from "@mui/material";
import { FC } from "react";

import { useConfig } from "@/hooks/useConfig";
import { EntityType } from "@/services/types";
import { ISubscriber } from "@/types/subscriber.types";

import { getAvatarSrc } from "../helpers/mapMessages";

const AvatarItem = styled(Avatar)(() => ({
  transform: "scale(0.8)",
  opacity: 0.7,
  transition: "transform 0.2s ease, opacity 0.2s ease",
  cursor: "pointer",

  "&.firstAvatar, &.secondAvatar:hover": {
    transform: "scale(1)",
    opacity: 1,
  },

  "&.secondAvatar": {
    position: "relative",
    right: 4,
  },

  "&.secondAvatar:hover": {
    zIndex: 2,
  },

  "&.secondAvatar:hover ~ .firstAvatar": {
    transform: "scale(0.8)",
    opacity: 0.7,
  },
}));

export const SubscriberAvatars: FC<{ subscriber: ISubscriber }> = ({
  subscriber,
}) => {
  const { apiUrl } = useConfig();

  return (
    <AvatarGroup
      max={2}
      sx={{
        width: 90,
        justifyContent: "center",
      }}
    >
      <AvatarItem
        src={getAvatarSrc(apiUrl, EntityType.SUBSCRIBER, subscriber.id)}
        alt={subscriber.fullName}
        className="firstAvatar"
      />
      {subscriber.assignedTo && (
        <AvatarItem
          src={getAvatarSrc(apiUrl, EntityType.USER, subscriber.assignedTo)}
          alt="Assigned Human Agent"
          className="secondAvatar"
        />
      )}
    </AvatarGroup>
  );
};
