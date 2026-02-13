/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { MenuItem, Paper, TextField } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useState } from "react";

import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { useSearch } from "@/hooks/useSearch";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IChannel } from "@/types/channel.types";

import { Chat } from "./components/Chat";
import { SubscribersList } from "./components/ConversationsList";
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
  const [channels, setChannels] = useState<string[]>([]);
  const [assignment, setAssignment] = useState<AssignedTo>(AssignedTo.ALL);

  return (
    <ChatProvider>
      <Grid
        container
        spacing={0}
        wrap="nowrap"
        sx={{
          height: "calc(100vh - 64px)",
          maxHeight: "calc(100vh - 64px)",
        }}
      >
        <Grid width="100%" height="100%" flexDirection="row" display="flex">
          <Paper
            sx={{
              width: "375px",
              height: "100%",
              overflow: "hidden",
              borderRadius: 0,
            }}
          >
            <Grid gap={2} flexDirection="column" display="flex" height="100%">
              <Grid
                m={2}
                mb={0}
                gap={0.5}
                flexDirection="column"
                display="flex"
              >
                <FilterTextfield
                  onChange={onSearch}
                  defaultValue={searchText}
                />
                <AutoCompleteEntitySelect<IChannel, "name">
                  searchFields={["name"]}
                  entity={EntityType.CHANNEL}
                  format={Format.BASIC}
                  idKey="name"
                  labelKey="name"
                  multiple={true}
                  onChange={(_e, selected, ..._) => {
                    setChannels((selected || [])?.map(({ name }) => name));
                  }}
                  label={t("label.channel")}
                  value={channels}
                  limitTags={2}
                />
                <TextField
                  onChange={(e) => setAssignment(e.target.value as AssignedTo)}
                  label={t("label.assigned_to")}
                  select
                  defaultValue={AssignedTo.ALL}
                >
                  <MenuItem value={AssignedTo.ALL}>All</MenuItem>
                  <MenuItem value={AssignedTo.ME}>To Me</MenuItem>
                  <MenuItem value={AssignedTo.OTHERS}>To Others</MenuItem>
                </TextField>
              </Grid>
              <SubscribersList
                channels={channels}
                searchPayload={searchPayload}
                assignedTo={assignment}
              />
            </Grid>
          </Paper>
          <Grid flex="auto" height="100%" alignContent="center">
            <Chat />
          </Grid>
        </Grid>
      </Grid>
    </ChatProvider>
  );
};
