/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, Typography } from "@mui/material";
import { useMemo } from "react";

import AutoCompleteSelect from "@/app-components/inputs/AutoCompleteSelect";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IBlock, PayloadPattern } from "@/types/block.types";
import {
  PostBackButton,
  StdOutgoingButtonsMessage,
  StdOutgoingQuickRepliesMessage,
  StdQuickReply,
} from "@/types/message.types";

import { useBlock } from "../../BlockFormProvider";

type PayloadOption = {
  id: string;
  label: string;
  group?: string;
};

type PostbackInputProps = {
  value?: string | null;
  onChange: (pattern: PayloadPattern) => void;
};

export const PostbackInput = ({ value, onChange }: PostbackInputProps) => {
  const block = useBlock();
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const { t } = useTranslate();
  //  General options
  const generalOptions = [
    {
      id: "GET_STARTED",
      label: t("label.get_started"),
      group: t("label.general"),
    },

    {
      id: "VIEW_MORE",
      label: t("label.view_more"),
      group: t("label.general"),
    },
    {
      id: "LOCATION",
      label: t("label.location"),
      group: t("label.general"),
    },
  ];
  //  Gather previous blocks buttons
  const btnOptions = useMemo(
    () =>
      (block?.previousBlocks || [])
        .map((b) => getBlockFromCache(b))
        .filter((b) => {
          return b && typeof b.message === "object" && "buttons" in b.message;
        })
        .map((b) => b as IBlock)
        .reduce((acc, b) => {
          const postbackButtons = (
            (b.message as StdOutgoingButtonsMessage)?.buttons || []
          )
            .filter((btn) => btn.type === "postback")
            .map((btn) => {
              return { ...btn, group: b.name };
            });

          return acc.concat(postbackButtons);
        }, [] as (PostBackButton & { group: string })[])
        .map((btn) => {
          return {
            id: btn.payload,
            label: btn.title,
            group: btn.group,
          };
        }),
    [block?.previousBlocks, getBlockFromCache],
  );
  //  Gather previous blocks quick replies
  const qrOptions = useMemo(
    () =>
      (block?.previousBlocks || [])
        .map((b) => getBlockFromCache(b))
        .filter((b) => {
          return (
            b && typeof b.message === "object" && "quickReplies" in b.message
          );
        })
        .map((b) => b as IBlock)
        .reduce((acc, b) => {
          const postbackQuickReplies = (
            (b.message as StdOutgoingQuickRepliesMessage)?.quickReplies || []
          )
            .filter((btn) => btn.content_type === "text")
            .map((btn) => {
              return { ...btn, group: b.name };
            });

          return acc.concat(postbackQuickReplies);
        }, [] as (StdQuickReply & { group: string })[])
        .map((btn) => {
          return {
            id: btn.payload as string,
            label: btn.title as string,
            group: btn.group,
          };
        }),
    [block?.previousBlocks],
  );
  // Concat all previous blocks
  const options = [...generalOptions, ...btnOptions, ...qrOptions];

  return (
    <>
      <AutoCompleteSelect<PayloadOption, "label", false>
        value={value}
        options={options}
        labelKey="label"
        label={t("label.postback")}
        multiple={false}
        onChange={(_e, content) => {
          content &&
            onChange({
              label: content.label,
              value: content.id,
            } as PayloadPattern);
        }}
        groupBy={(option) => {
          return option.group ?? t("label.other");
        }}
        renderGroup={(params) => (
          <li key={params.key}>
            <Typography component="h4" p={2} fontWeight={700} color="primary">
              {params.group}
            </Typography>
            <Box>{params.children}</Box>
          </li>
        )}
      />
    </>
  );
};
