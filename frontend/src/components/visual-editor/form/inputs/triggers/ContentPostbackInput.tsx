/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import AutoCompleteSelect from "@/app-components/inputs/AutoCompleteSelect";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType, Format } from "@/services/types";
import { IBlock, PayloadPattern } from "@/types/block.types";

import { useBlock } from "../../BlockFormProvider";

type ContentPayloadOption = {
  id: string;
  label: string;
};

type ContentPostbackInputProps = {
  value?: string | null;
  onChange: (pattern: PayloadPattern) => void;
};

export const ContentPostbackInput = ({
  value,
  onChange,
}: ContentPostbackInputProps) => {
  const { t } = useTranslation();
  const block = useBlock();
  const { data: contents } = useFind(
    { entity: EntityType.CONTENT, format: Format.FULL },
    {
      hasCount: false,
    },
  );
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const options = useMemo(
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
              id: btn.title,
              label: btn.title,
            });

            return availableContents.reduce((acc, n) => {
              acc.push({
                id: btn.title + ":" + n.title,
                label: btn.title + ":" + n.title,
              });

              return acc;
            }, payloads);
          }, [] as ContentPayloadOption[]);
        })
        .flat(),
    [block?.previousBlocks, contents, getBlockFromCache],
  );

  return (
    <AutoCompleteSelect<ContentPayloadOption, "label", false>
      value={value}
      options={options}
      labelKey="label"
      label={t("label.content")}
      multiple={false}
      onChange={(_e, content) => {
        content &&
          onChange({
            label: content.label,
            value: content.id,
            type: "content",
          } as PayloadPattern);
      }}
      groupBy={(option) => {
        const [btn] = option.label.split(":");

        return btn;
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
  );
};
