/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Avatar as MuiAvatar,
  AvatarProps as MuiAvatarProps,
  SxProps,
  useTheme,
} from "@mui/material";
import { useMemo } from "react";

import { getAvatarSrc } from "@/components/inbox/helpers/mapMessages";
import { useGet } from "@/hooks/crud/useGet";
import { useConfig } from "@/hooks/useConfig";
import { EntityType } from "@/services/types";

interface AvatarProps extends MuiAvatarProps {
  subscriberId?: string | null;
  size?: number;
}

const useSubscriberSrc = (subscriberId: string = "") => {
  const { apiUrl } = useConfig();
  const theme = useTheme();
  const { data } = useGet(
    subscriberId,
    { entity: EntityType.SUBSCRIBER },
    { enabled: !!subscriberId },
  );
  const subscriberCachedId = useMemo(() => data?.id, [data?.avatar]);
  const avatarSrc = useMemo(
    () => getAvatarSrc(apiUrl, EntityType.SUBSCRIBER, subscriberCachedId),
    [subscriberCachedId],
  );
  const botAvatarSrc = useMemo(
    () => getAvatarSrc(apiUrl, EntityType.USER, "bot"),
    [subscriberCachedId],
  );

  return subscriberId
    ? `${avatarSrc}?avatar=${data?.avatar}`
    : `${botAvatarSrc}?color=${encodeURIComponent(theme.palette.primary.main)}`;
};

export const Avatar = ({
  src,
  size,
  subscriberId = "",
  ...rest
}: AvatarProps) => {
  const avatarSrc = useSubscriberSrc(subscriberId || "");
  const sx = useMemo(
    () =>
      size ? { ...rest.sx, width: size, height: size } : (rest.sx as SxProps),
    [size],
  );

  return <MuiAvatar {...rest} sx={sx} src={src || avatarSrc} />;
};

Avatar.displayName = "Avatar";
