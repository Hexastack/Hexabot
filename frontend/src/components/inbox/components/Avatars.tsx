/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Avatar, AvatarGroup } from "@chatscope/chat-ui-kit-react";

import { useConfig } from "@/hooks/useConfig";
import { useSetting } from "@/hooks/useSetting";
import { EntityType } from "@/services/types";
import { ISubscriber } from "@/types/subscriber.types";

import { getAvatarSrc } from "../helpers/mapMessages";

export const Avatars = ({ subscriber }: { subscriber: ISubscriber }) => {
  const { apiUrl } = useConfig();
  const color = useSetting("console_channel", "theme_color");

  return (
    <AvatarGroup hoverToFront style={{ width: "70px" }}>
      <Avatar
        src={getAvatarSrc(apiUrl, EntityType.SUBSCRIBER, subscriber.id)}
        title={`${subscriber.first_name} ${subscriber.last_name}`}
      />
      <Avatar
        src={`${getAvatarSrc(
          apiUrl,
          EntityType.USER,
          subscriber.assignedTo || "",
        )}?color=${color}`}
      />
    </AvatarGroup>
  );
};
