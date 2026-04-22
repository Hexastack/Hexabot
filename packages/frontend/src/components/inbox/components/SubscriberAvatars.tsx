/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import AvatarGroup from "@mui/material/AvatarGroup";
import { FC } from "react";

import { Avatar } from "@/app-components/displays/Avatar";
import { Subscriber } from "@/types/subscriber.types";

export const SubscriberAvatars: FC<{ subscriber: Subscriber }> = ({
  subscriber,
}) => {
  return (
    <AvatarGroup
      max={2}
      spacing="small"
      sx={{
        width: "fit-content",
        justifyContent: "flex-start",
        "& .MuiAvatar-root": {
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
      <Avatar size={26} subscriberId={subscriber.id} />
      {subscriber.assignedTo && (
        <Avatar size={26} subscriberId={subscriber.assignedTo} />
      )}
    </AvatarGroup>
  );
};
