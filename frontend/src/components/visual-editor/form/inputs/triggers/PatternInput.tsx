/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, Grid, MenuItem, TextFieldProps, Typography } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { RegisterOptions, useFormContext } from "react-hook-form";

import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import AutoCompleteNlpPatternSelect from "@/app-components/inputs/AutoCompleteNlpPatternSelect";
import { Input } from "@/app-components/inputs/Input";
import { RegexInput } from "@/app-components/inputs/RegexInput";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import {
  IBlockAttributes,
  IBlockFull,
  NlpPattern,
  Pattern,
  PatternType,
  PayloadPattern,
} from "@/types/block.types";
import { IMenuItem } from "@/types/menu.types";
import { INlpEntity } from "@/types/nlp-entity.types";
import { INlpValue } from "@/types/nlp-value.types";

import { ContentPostbackInput } from "./ContentPostbackInput";
import { PostbackInput } from "./PostbackInput";

const isRegex = (str: Pattern) => {
  return typeof str === "string" && str.startsWith("/") && str.endsWith("/");
};
const getType = (pattern: Pattern): PatternType => {
  if (isRegex(pattern)) {
    return "regex";
  } else if (Array.isArray(pattern)) {
    return "nlp";
  } else if (typeof pattern === "object" && pattern !== null) {
    if (pattern.type === "menu") {
      return "menu";
    } else if (pattern.type === "content") {
      return "content";
    } else {
      return "payload";
    }
  } else {
    return "text";
  }
};

type PatternInputProps = {
  value: Pattern;
  onChange: (pattern: Pattern) => void;
  block?: IBlockFull;
  idx: number;
  getInputProps?: (index: number) => TextFieldProps;
};

const PatternInput: FC<PatternInputProps> = ({
  value,
  onChange,
  idx,
  getInputProps,
}) => {
  const { t } = useTranslate();
  const {
    register,
    formState: { errors },
  } = useFormContext<IBlockAttributes>();
  const getNlpEntityFromCache = useGetFromCache(EntityType.NLP_ENTITY);
  const [pattern, setPattern] = useState<Pattern>(value);
  const [patternType, setPatternType] = useState<PatternType>(getType(value));
  const types = [
    { value: "text", label: t("label.match_sound") },
    { value: "regex", label: t("label.regex") },
    { value: "payload", label: t("label.postback") },
    { value: "nlp", label: t("label.nlp") },
    { value: "menu", label: t("label.menu") },
    { value: "content", label: t("label.content") },
  ];
  const registerInput = (
    errorMessage: string,
    idx: number,
    additionalOptions?: RegisterOptions<IBlockAttributes>,
  ) => {
    return {
      ...register(`patterns.${idx}`, {
        required: errorMessage,
        ...additionalOptions,
      }),
      helperText: errors.patterns?.[idx]
        ? errors.patterns[idx].message
        : undefined,
      error: !!errors.patterns?.[idx],
    };
  };

  useEffect(() => {
    if (pattern || pattern === "") {
      onChange(pattern);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern]);

  return (
    <>
      <Grid item xs={2}>
        <Input
          select
          label={t("label.type")}
          value={patternType}
          onChange={(e) => {
            const selected = e.target.value as PatternType;

            switch (selected) {
              case "regex": {
                setPattern("//");
                break;
              }
              case "nlp": {
                setPattern([]);
                break;
              }
              case "menu":
              case "content":
              case "payload": {
                setPattern(null);
                break;
              }
              default: {
                setPattern("");
              }
            }

            setPatternType(selected);
          }}
        >
          {types.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Input>
      </Grid>
      <Grid item xs={9}>
        {patternType === "nlp" ? (
          <AutoCompleteNlpPatternSelect<INlpValue, "value">
            value={(pattern as NlpPattern[]).map((v) =>
              "value" in v && v.value ? v.value : v.entity,
            )}
            type={(pattern as NlpPattern[]).map((v) => v.match)[0]}
            searchFields={["value", "label"]}
            entity={EntityType.NLP_VALUE}
            format={Format.FULL}
            idKey="value"
            labelKey="value"
            label={t("label.nlp")}
            multiple={true}
            onChange={(_e, data) => {
              setPattern(
                data.map((d) => {
                  const entity = getNlpEntityFromCache(d.entity) as INlpEntity;

                  return d.value === d.entity
                    ? {
                        match: "entity",
                        entity: entity.name,
                      }
                    : {
                        match: "value",
                        entity: entity.name,
                        value: d.value,
                      };
                }),
              );
            }}
            getOptionLabel={(option) => {
              const entity = getNlpEntityFromCache(option.entity) as INlpEntity;

              if (entity.name === option.value) {
                return `${entity.name}=any`;
              } else return `${entity.name}=${option.value}`;
            }}
            groupBy={(option) => {
              const entity = getNlpEntityFromCache(option.entity) as INlpEntity;

              return entity.name;
            }}
            renderGroup={(params) => (
              <li key={params.key}>
                <Typography
                  component="h4"
                  p={2}
                  fontWeight={700}
                  color="primary"
                >
                  {params.group}
                </Typography>
                <Box>{params.children}</Box>
              </li>
            )}
            preprocess={(options) => {
              return options.reduce((acc, curr) => {
                const entity = getNlpEntityFromCache(curr.entity) as INlpEntity;

                if (entity.lookups.includes("keywords")) {
                  const exists = acc.find(
                    ({ value, id }) =>
                      value === entity.name && id === entity.id,
                  );

                  if (!exists) {
                    acc.push({
                      entity: entity.id,
                      id: entity.id,
                      value: entity.name,
                    } as INlpValue);
                  }
                }
                acc.push(curr);

                return acc;
              }, [] as INlpValue[]);
            }}
          />
        ) : null}
        {patternType === "menu" ? (
          <AutoCompleteEntitySelect<IMenuItem, "title", false>
            value={pattern ? (pattern as PayloadPattern).value : null}
            searchFields={["title"]}
            entity={EntityType.MENU}
            format={Format.BASIC}
            idKey="payload"
            labelKey="title"
            label={t("label.menu")}
            multiple={false}
            onChange={(_e, menuItem) => {
              menuItem &&
                setPattern({
                  label: menuItem?.title,
                  value: menuItem?.payload,
                  type: "menu",
                } as PayloadPattern);
            }}
            preprocess={(items) => {
              return items.filter((item) => "payload" in item);
            }}
          />
        ) : null}
        {patternType === "content" ? (
          <ContentPostbackInput
            onChange={(payload) => {
              payload && setPattern(payload);
            }}
            value={pattern ? (pattern as PayloadPattern).value : null}
          />
        ) : null}
        {patternType === "payload" ? (
          <PostbackInput
            onChange={(payload) => {
              payload && setPattern(payload);
            }}
            value={pattern ? (pattern as PayloadPattern).value : null}
          />
        ) : null}
        {typeof value === "string" && patternType === "regex" ? (
          <RegexInput
            {...registerInput(t("message.regex_is_empty"), idx, {
              validate: (pattern) => {
                try {
                  const parsedPattern = new RegExp(pattern.slice(1, -1));

                  if (String(parsedPattern) !== pattern) {
                    throw t("message.regex_is_invalid");
                  }

                  return true;
                } catch (_e) {
                  return t("message.regex_is_invalid");
                }
              },
              setValueAs: (v) => (isRegex(v) ? v : `/${v}/`),
            })}
            label={t("label.regex")}
            value={value.slice(1, -1)}
            onChange={(v) => onChange(v)}
            required
          />
        ) : null}
        {typeof value === "string" && patternType === "text" ? (
          <Input
            {...(getInputProps ? getInputProps(idx) : null)}
            label={t("label.text")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : null}
      </Grid>
    </>
  );
};

export default PatternInput;
