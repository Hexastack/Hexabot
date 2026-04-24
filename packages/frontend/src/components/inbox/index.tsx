/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Source } from "@hexabot-ai/types";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { useSearch } from "@/hooks/useSearch";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";

import { Chat } from "./components/Chat";
import { ConversationsList } from "./components/ConversationsList";
import { ChatProvider } from "./hooks/ChatContext";
import { AssignedTo } from "./types";

export const Inbox = () => {
  const { t } = useTranslate();
  const { onSearch, searchPayload, searchText } =
    useSearch<EntityType.SUBSCRIBER>(
      {
        $or: ["firstName", "lastName"],
      },
      { syncUrl: true },
    );
  const [sources, setSources] = useState<string[]>([]);
  const [assignment, setAssignment] = useState<AssignedTo>(AssignedTo.ALL);

  return (
    <ChatProvider>
      <Stack
        direction="row"
        spacing={0}
        sx={{
          height: "calc(100vh - 64px)",
          maxHeight: "calc(100vh - 64px)",
          minWidth: 0,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            minWidth: 375,
            width: 390,
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack spacing={2} sx={{ height: "100%" }}>
            <Stack spacing={1} sx={{ p: 2, pb: 1.5 }}>
              <FilterTextfield onChange={onSearch} defaultValue={searchText} />
              <AutoCompleteEntitySelect<Source, "name">
                searchFields={["name", "channel"]}
                entity={EntityType.SOURCE}
                format={Format.BASIC}
                idKey="id"
                labelKey="name"
                multiple={true}
                onChange={(_e, selected, ..._) => {
                  setSources((selected || [])?.map(({ id }) => id));
                }}
                label={t("label.source")}
                value={sources}
                where={{ state: true }}
                limitTags={2}
              />
              <TextField
                value={assignment}
                onChange={(e) => setAssignment(e.target.value as AssignedTo)}
                label={t("label.assigned_to")}
                select
              >
                <MenuItem value={AssignedTo.ALL}>{t(AssignedTo.ALL)}</MenuItem>
                <MenuItem value={AssignedTo.ME}>{t(AssignedTo.ME)}</MenuItem>
                <MenuItem value={AssignedTo.OTHERS}>
                  {t(AssignedTo.OTHERS)}
                </MenuItem>
              </TextField>
            </Stack>
            <ConversationsList
              sources={sources}
              searchPayload={searchPayload}
              assignedTo={assignment}
            />
          </Stack>
        </Paper>
        <Box sx={{ flex: 1, minWidth: 0, height: "100%" }}>
          <Chat />
        </Box>
      </Stack>
    </ChatProvider>
  );
};
