/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Avatar } from "@chatscope/chat-ui-kit-react";
import { faHandPointRight } from "@fortawesome/free-solid-svg-icons";
import { Button, Grid, IconButton, MenuItem, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { UnifiedIcon } from "@/app-components/icons/UnifiedIcon";
import { Input } from "@/app-components/inputs/Input";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";

import { getAvatarSrc } from "../helpers/mapMessages";
import { useChat } from "../hooks/ChatContext";

export const ChatActions = () => {
  const { apiUrl } = useConfig();
  const { t } = useTranslate();
  const { subscriber: activeChat } = useChat();
  const [takeoverBy, setTakeoverBy] = useState<string>(
    activeChat?.assignedTo ?? "",
  );
  const { mutate } = useUpdate(EntityType.SUBSCRIBER);
  const { user } = useAuth();
  const { data: users } = useFind({
    entity: EntityType.USER,
  });

  useEffect(() => {
    setTakeoverBy(activeChat?.assignedTo ?? "");
  }, [activeChat?.assignedTo]);

  return (
    <Grid gap="6px" container alignItems="center">
      <Grid flexGrow={0} flexShrink={1} minWidth="150px">
        {users.length > 0 && (
          <Input
            onChange={(e) => setTakeoverBy(e.target.value)}
            value={takeoverBy}
            disabled={!activeChat}
            label={t("label.assign_to")}
            select
          >
            {(users || []).map((user) => (
              <MenuItem key={user.id} value={user.id}>
                <Grid direction="row" container alignItems="center" gap="4px">
                  <Grid>
                    <Avatar
                      size="sm"
                      name={user.first_name}
                      src={getAvatarSrc(apiUrl, EntityType.USER, user.id)}
                    />
                  </Grid>
                  <Grid>
                    <Typography sx={{ textTransform: "capitalize" }}>
                      {user.first_name} {user.last_name}
                    </Typography>
                  </Grid>
                </Grid>
              </MenuItem>
            ))}
          </Input>
        )}
      </Grid>
      <Grid flexShrink={0}>
        <IconButton
          disabled={!activeChat}
          onClick={() =>
            activeChat &&
            takeoverBy &&
            mutate({
              id: activeChat?.id,
              params: { assignedTo: takeoverBy },
            })
          }
          sx={{ outline: "#AAAAAA solid 1px" }}
          color="default"
        >
          <UnifiedIcon Icon={faHandPointRight} color="black" />
        </IconButton>
      </Grid>

      <Grid flexShrink={0}>
        <Button
          disabled={!activeChat}
          onClick={() =>
            activeChat &&
            mutate({
              id: activeChat?.id,
              params: {
                assignedTo:
                  user && user.id === activeChat?.assignedTo ? null : user?.id,
              },
            })
          }
        >
          {user && user.id === activeChat?.assignedTo
            ? t("button.handback")
            : t("button.takeover")}
        </Button>
      </Grid>
    </Grid>
  );
};
