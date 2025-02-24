/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { MainContainer, Search, Sidebar } from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { Grid, MenuItem } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { useSearch } from "@/hooks/useSearch";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IChannel } from "@/types/channel.types";
import { ISubscriber } from "@/types/subscriber.types";

import { Chat } from "./components/Chat";
import { SubscribersList } from "./components/ConversationsList";
import { ChatProvider } from "./hooks/ChatContext";
import { AssignedTo } from "./types";

export const Inbox = () => {
  const { t } = useTranslate();
  const { onSearch, searchPayload } = useSearch<ISubscriber>({
    $or: ["first_name", "last_name"],
  });
  const [channels, setChannels] = useState<string[]>([]);
  const [assignment, setAssignment] = useState<AssignedTo>(AssignedTo.ALL);
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchText = searchParams.get("search") || "";

  useEffect(() => {
    if (searchText) {
      onSearch(searchText);
    }
  }, [searchText]);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`?${params.toString()}`);
    onSearch(value);
  };
  
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
            <Sidebar position="left">
              <Grid paddingX={1} paddingTop={1}>
              <Search
                  value={searchText}
                  onClearClick={() => handleSearch("")}
                  className="changeColor"
                  onChange={handleSearch}
                  placeholder="Search..."
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
