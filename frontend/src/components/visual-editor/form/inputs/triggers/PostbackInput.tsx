/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Autocomplete,
  Box,
  CircularProgress,
  InputAdornment,
  Skeleton,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import { Input } from "@/app-components/inputs/Input";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IBlock, PayloadPattern } from "@/types/block.types";
import {
  ButtonType,
  PayloadType,
  PostBackButton,
  StdOutgoingButtonsMessage,
  StdOutgoingQuickRepliesMessage,
  StdQuickReply,
} from "@/types/message.types";

import { useBlock } from "../../BlockFormProvider";

type PayloadOption = PayloadPattern & {
  group: string;
};

const isSamePostback = <T extends PayloadPattern>(a: T, b: T) => {
  return a.label === b.label && a.value === b.value;
};

type PostbackInputProps = {
  defaultValue?: PayloadPattern;
  onChange: (pattern: PayloadPattern | null) => void;
};

export const PostbackInput = ({
  defaultValue,
  onChange,
}: PostbackInputProps) => {
  const block = useBlock();
  const [selectedValue, setSelectedValue] = useState(defaultValue || null);
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const { data: menu, isLoading: isLoadingMenu } = useFind(
    { entity: EntityType.MENU, format: Format.FULL },
    { hasCount: false },
  );
  const { data: contents, isLoading: isLoadingContent } = useFind(
    { entity: EntityType.CONTENT, format: Format.FULL },
    {
      hasCount: false,
    },
  );
  const { t } = useTranslate();
  //  General options
  const generalOptions = [
    {
      label: t("label.get_started"),
      value: "GET_STARTED",
      group: "general",
    },

    {
      label: t("label.view_more"),
      value: "VIEW_MORE",
      group: "general",
    },
    {
      label: t("label.location"),
      value: "LOCATION",
      type: PayloadType.location,
      group: "general",
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
            .filter((btn) => btn.type === ButtonType.postback)
            .map((btn) => {
              return { ...btn, group: b.name };
            });

          return acc.concat(postbackButtons);
        }, [] as (PostBackButton & { group: string })[])
        .map((btn) => {
          return {
            label: btn.title,
            value: btn.payload,
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
            value: btn.payload as string,
            type: PayloadType.menu,
            group: btn.group,
          };
        }),
    [block?.previousBlocks],
  );
  const menuOptions = menu
    .filter(({ payload }) => payload)
    .map(({ title, payload }) => ({
      id: title,
      label: title,
      value: payload as string,
      type: PayloadType.menu,
      group: "menu",
    }));
  const contentOptions = useMemo(
    () =>
      (block?.previousBlocks || [])
        .map((bId) => getBlockFromCache(bId))
        .filter((b) => {
          return (
            b &&
            b.options?.content?.entity &&
            b.options.content.buttons.length > 0
          );
        })
        .map((b) => b as IBlock)
        .map((b) => {
          const availableContents = (contents || []).filter(
            ({ entity, status }) =>
              status && entity === b.options?.content?.entity,
          );

          return (b.options?.content?.buttons || []).reduce((payloads, btn) => {
            // Return a payload for each node/button combination
            payloads.push({
              label: btn.title,
              value: btn.title,
              type: PayloadType.content,
              group: "content",
            });

            return availableContents.reduce((acc, n) => {
              acc.push({
                label: n.title,
                value: n.title,
                type: PayloadType.content,
                group: "content",
              });

              return acc;
            }, payloads);
          }, [] as PayloadOption[]);
        })
        .flat(),
    [block?.previousBlocks, contents, getBlockFromCache],
  );
  // Concat all previous blocks
  const options: PayloadOption[] = [
    ...generalOptions,
    ...btnOptions,
    ...qrOptions,
    ...menuOptions,
    ...contentOptions,
  ];
  const isOptionsReady =
    !defaultValue || options.find((o) => isSamePostback(o, defaultValue));

  if (!isOptionsReady) {
    return (
      <Skeleton animation="wave" variant="rounded" width="100%" height={40} />
    );
  }
  const selected = defaultValue
    ? options.find((o) => {
        return isSamePostback(o, defaultValue);
      })
    : undefined;

  return (
    <Autocomplete<PayloadOption>
      size="small"
      defaultValue={selected}
      options={options}
      // label={t("label.postback")}
      multiple={false}
      onChange={(_e, value) => {
        setSelectedValue(value);
        if (value) {
          const {  group: _g, ...payloadPattern } = value;

          onChange(payloadPattern);
        } else {
          onChange(null);
        }
      }}
      groupBy={(option) => {
        return option.group ?? t("label.other");
      }}
      getOptionLabel={({ label }) => label}
      renderGroup={(params) => (
        <li key={params.key}>
          <Typography component="h4" p={2} fontWeight={700} color="primary">
            {t(`label.${params.group}`)}
          </Typography>
          <Box>{params.children}</Box>
        </li>
      )}
      renderInput={(props) => {
        return (
          <Input
            {...props}
            label={t("label.postback")}
            InputProps={{
              ...props.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  {selectedValue?.type || t("label.postback")}
                </InputAdornment>
              ),
              endAdornment:
                isLoadingMenu || isLoadingContent ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null,
            }}
          />
        );
      }}
    />
  );
};
