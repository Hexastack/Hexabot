/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ChipEntity } from "@/app-components/displays/ChipEntity";
import { EntityType } from "@/services/types";

import { useChat } from "../hooks/ChatContext";

export const ChatHeader = () => {
  const { subscriber } = useChat();

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      flexWrap="wrap"
      flexGrow={1}
      width={240}
    >
      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
        {subscriber?.fullName}:
      </Typography>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {(subscriber?.labels || []).map((label) => (
          <ChipEntity
            id={label}
            key={label}
            field="title"
            entity={EntityType.LABEL}
          />
        ))}
      </Stack>
    </Stack>
  );
};
