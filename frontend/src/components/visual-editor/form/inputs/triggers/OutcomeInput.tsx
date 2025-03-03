/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Autocomplete,
  Box,
  Chip,
  InputAdornment,
  Skeleton,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import { Input } from "@/app-components/inputs/Input";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { theme } from "@/layout/themes/theme";
import { EntityType } from "@/services/types";
import { IBlock, PayloadPattern } from "@/types/block.types";
import { PayloadType } from "@/types/message.types";
import { getNamespace } from "@/utils/string";

import { useBlock } from "../../BlockFormProvider";

type PayloadOption = PayloadPattern & {
  group: string;
};

type OutcomeInputProps = {
  defaultValue: PayloadPattern;
  onChange: (pattern: PayloadPattern) => void;
};

export const OutcomeInput = ({ defaultValue, onChange }: OutcomeInputProps) => {
  const block = useBlock();
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const { t } = useTranslate();
  //  Gather previous blocks outcomes
  const options = useMemo(
    () =>
      (block?.previousBlocks || [])
        .map((b) => getBlockFromCache(b))
        .filter((b) => b && Array.isArray(b.outcomes) && b.outcomes.length > 0)
        .map((b) => b as IBlock)
        .reduce(
          (acc, b) => {
            const outcomes = (b.outcomes || []).map((outcome) => ({
              label: t(`label.${outcome}` as any, {
                defaultValue: outcome,
                ns:
                  "plugin" in b.message
                    ? getNamespace(b.message.plugin)
                    : undefined,
              }),
              value: outcome,
              group: b.name,
              type: PayloadType.outcome,
            }));

            return acc.concat(outcomes);
          },
          [
            {
              label: t("label.any_outcome"),
              value: "any",
              type: PayloadType.outcome,
              group: "general",
            },
          ] as PayloadOption[],
        ),
    [block?.previousBlocks, getBlockFromCache],
  );
  const isOptionsReady =
    !defaultValue || options.find((o) => o.value === defaultValue.value);

  if (!isOptionsReady) {
    return (
      <Skeleton animation="wave" variant="rounded" width="100%" height={40} />
    );
  }

  const selected = defaultValue
    ? options.find((o) => o.value === defaultValue.value)
    : undefined;

  return (
    <Autocomplete
      size="small"
      fullWidth
      defaultValue={selected || undefined}
      value={selected}
      options={options}
      multiple={false}
      disableClearable
      onChange={(_e, value) => {
        setSelectedValue(value);
        const { group: _g, ...payloadPattern } = value;

        onChange(payloadPattern);
      }}
      groupBy={({ group }) => group ?? t("label.other")}
      getOptionLabel={({ label }) => label}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderGroup={({ key, group, children }) => (
        <li key={key}>
          <Typography component="h4" p={2} fontWeight={700} color="primary">
            {t(`label.${group}`, { defaultValue: group })}
          </Typography>
          <Box>{children}</Box>
        </li>
      )}
      renderInput={(props) => (
        <Input
          {...props}
          label={t("label.outcome")}
          InputProps={{
            ...props.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Chip
                  sx={{
                    left: "8px",
                    height: "25px",
                    fontSize: "12px",
                    minWidth: "75px",
                    position: "relative",
                    maxHeight: "30px",
                    borderRadius: "16px",
                    borderColor: theme.palette.grey[400],
                  }}
                  color="primary"
                  label={t(
                    `label.${selectedValue?.type || "outcome"}`,
                  ).toLocaleLowerCase()}
                  variant="role"
                />
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
};
