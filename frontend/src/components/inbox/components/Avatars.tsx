/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Avatar, AvatarGroup } from "@chatscope/chat-ui-kit-react";
import { styled } from "@mui/material";
import { FC } from "react";

import { useConfig } from "@/hooks/useConfig";
import { EntityType } from "@/services/types";
import { ISubscriber } from "@/types/subscriber.types";

import { getAvatarSrc } from "../helpers/mapMessages";

const StyledAvatar = styled(Avatar)(() => ({
  transform: "scale(0.5)",
  opacity: 0.7,
  transition: ".2s",
  "&.firstAvatar": { transform: "scale(1)", opacity: 1 },
  "&.secondAvatar:hover ~ .firstAvatar": {
    transform: "scale(0.5)",
    opacity: 0.7,
  },
  "&.secondAvatar:hover": {
    transform: "scale(1)",
    opacity: 1,
  },
}));

export type TAvatarGroupProps = { subscriber: ISubscriber };

export const Avatars: FC<TAvatarGroupProps> = ({ subscriber }) => {
  const { apiUrl } = useConfig();

  return (
    <AvatarGroup
      hoverToFront
      style={{ width: "70px", marginRight: "10px", justifyContent: "center" }}
    >
      <StyledAvatar
        src={getAvatarSrc(apiUrl, EntityType.SUBSCRIBER, subscriber.id)}
        title={`${subscriber.first_name} ${subscriber.last_name}`}
        className="firstAvatar"
      />
      {subscriber.assignedTo ? (
        <StyledAvatar
          src={getAvatarSrc(apiUrl, EntityType.USER, subscriber.assignedTo)}
          title="Assigned Human Agent"
          className="secondAvatar"
        />
      ) : null}
    </AvatarGroup>
  );
};
