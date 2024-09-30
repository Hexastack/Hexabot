/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
