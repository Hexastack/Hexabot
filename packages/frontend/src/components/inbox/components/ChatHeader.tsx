/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid, Typography } from "@mui/material";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import { EntityType } from "@/services/types";

import { useChat } from "../hooks/ChatContext";

export const ChatHeader = () => {
  const { subscriber } = useChat();

  return (
    <Grid container gap="7px" direction="row">
      <Grid>
        <Typography fontSize="1.17em" fontWeight={700}>
          {subscriber?.first_name} {subscriber?.last_name} :
        </Typography>
      </Grid>
      <Grid gap="4px" container width="fit-content">
        {subscriber
          ? subscriber?.labels?.map((label) => (
              <ChipEntity
                id={label}
                key={label}
                variant="role"
                field="title"
                entity={EntityType.LABEL}
              />
            ))
          : null}
      </Grid>
    </Grid>
  );
};
