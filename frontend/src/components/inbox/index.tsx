/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { MainContainer, Sidebar } from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { Grid, MenuItem } from "@mui/material";
import { useState } from "react";

import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { FilterTextfield } from "@/app-components/inputs/FilterTextfield";
import { Input } from "@/app-components/inputs/Input";
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
        $or: ["first_name", "last_name"],
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
        <Grid item width="100%" height="100%" overflow="hidden">
          <MainContainer style={{ height: "100%" }}>
            <Sidebar position="left" style={{ flexBasis: "100%" }}>
              <Grid paddingX={1} paddingTop={2} paddingBottom={1} mx={1}>
                <FilterTextfield
                  onChange={onSearch}
                  defaultValue={searchText}
                />
              </Grid>
              <Grid
                display="flex"
                flexDirection="column"
                paddingX={2}
                marginY={1}
                gap={1}
              >
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
                <Input
                  onChange={(e) => setAssignment(e.target.value as AssignedTo)}
                  label={t("label.assigned_to")}
                  select
                  defaultValue={AssignedTo.ALL}
                  sx={{ marginTop: 1 }}
                >
                  <MenuItem value={AssignedTo.ALL}>All</MenuItem>
                  <MenuItem value={AssignedTo.ME}>To Me</MenuItem>
                  <MenuItem value={AssignedTo.OTHERS}>To Others</MenuItem>
                </Input>
              </Grid>
              <SubscribersList
                channels={channels}
                searchPayload={searchPayload}
                assignedTo={assignment}
              />
            </Sidebar>
            <Chat />
          </MainContainer>
        </Grid>
      </Grid>
    </ChatProvider>
  );
};
