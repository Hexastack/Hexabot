/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ArrowLeftOutlinedIcon from "@mui/icons-material/ArrowLeftOutlined";
import { Grid } from "@mui/material";
import { FC } from "react";
import { useFormContext } from "react-hook-form";

import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import AutoCompleteSelect from "@/app-components/inputs/AutoCompleteSelect";
import { useFind } from "@/hooks/crud/useFind";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { CaptureVar, IBlockAttributes, IBlockFull } from "@/types/block.types";
import { IContextVar } from "@/types/context-var.types";

type ContextVarOption = {
  value: CaptureVar["entity"] | null;
  label: string;
  group: string;
};

type ContextVarInputProps = {
  idx: number;
  value: CaptureVar;
  onChange: (pattern: CaptureVar) => void;
  block?: IBlockFull;
};

const ContextVarInput: FC<ContextVarInputProps> = ({
  idx,
  value,
  onChange,
}) => {
  const { t } = useTranslate();
  const {
    register,
    formState: { errors },
  } = useFormContext<IBlockAttributes>();
  const { data: nlpEntities } = useFind(
    {
      entity: EntityType.NLP_ENTITY,
    },
    {
      hasCount: false,
    },
  );
  const options: ContextVarOption[] = [
    { value: -1, label: t("label.text_message"), group: t("label.payload") },
    {
      value: -2,
      label: t("label.postback_payload"),
      group: t("label.payload"),
    },
    ...(nlpEntities || []).map(({ name }) => ({
      value: name,
      label: name,
      group: t("label.nlp_entity"),
    })),
  ];

  return (
    <>
      <Grid item xs={5}>
        <AutoCompleteEntitySelect<IContextVar, "label", false>
          searchFields={["label", "name"]}
          entity={EntityType.CONTEXT_VAR}
          format={Format.BASIC}
          idKey="name"
          labelKey="label"
          label={t("label.context_var")}
          multiple={false}
          value={value.context_var}
          {...register(`capture_vars.${idx}`, {
            required: t("message.context_var_is_required"),
          })}
          helperText={
            errors.capture_vars?.[idx]
              ? errors.capture_vars[idx].message
              : undefined
          }
          error={!!errors.capture_vars?.[idx]}
          onChange={(_e, selected) => {
            onChange({
              context_var: selected ? selected.name : selected,
              entity: value.entity,
            });
          }}
        />
      </Grid>
      <Grid item xs={1}>
        <ArrowLeftOutlinedIcon fontSize="large" />
      </Grid>
      <Grid item xs={5}>
        <AutoCompleteSelect<ContextVarOption, "label", false>
          idKey="value"
          labelKey="label"
          label={t("label.value")}
          multiple={false}
          value={value.entity as string}
          onChange={(_e, selected) => {
            onChange({
              context_var: value.context_var,
              entity: selected?.value || -1,
            });
          }}
          options={options}
          groupBy={({ group }) => group}
        />
      </Grid>
    </>
  );
};

export default ContextVarInput;
