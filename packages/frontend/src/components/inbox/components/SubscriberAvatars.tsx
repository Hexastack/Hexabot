/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import { FC } from "react";

import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ISubscriber } from "@/types/subscriber.types";

import { getAvatarSrc } from "../helpers/mapMessages";

export const SubscriberAvatars: FC<{ subscriber: ISubscriber }> = ({
  subscriber,
}) => {
  const { apiUrl } = useConfig();
  const { t } = useTranslate();

  return (
    <AvatarGroup
      max={2}
      spacing="small"
      sx={{
        width: "fit-content",
        justifyContent: "flex-start",
        "& .MuiAvatar-root": {
          width: 26,
          height: 26,
          fontSize: "0.7rem",
          transition: (theme) =>
            theme.transitions.create(["transform", "opacity"], {
              duration: theme.transitions.duration.shortest,
            }),
        },
        "& .MuiAvatar-root:first-of-type": {
          transform: "scale(1)",
          opacity: 1,
        },
        "& .MuiAvatar-root:last-of-type": {
          transform: "scale(0.88)",
          opacity: 0.7,
        },
        "&:hover .MuiAvatar-root:last-of-type": {
          transform: "scale(1)",
          opacity: 1,
          zIndex: 2,
        },
        "&:hover .MuiAvatar-root:first-of-type": {
          transform: "scale(0.88)",
          opacity: 0.7,
        },
      }}
    >
      <Avatar
        src={getAvatarSrc(apiUrl, EntityType.SUBSCRIBER, subscriber.id)}
        alt={subscriber.fullName}
      />
      {subscriber.assignedTo && (
        <Avatar
          src={getAvatarSrc(apiUrl, EntityType.USER, subscriber.assignedTo)}
          alt={t("label.assigned_to")}
        />
      )}
    </AvatarGroup>
  );
};
