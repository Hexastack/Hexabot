/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid, MenuItem, TextFieldProps } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { RegisterOptions, useFormContext } from "react-hook-form";

import { Input } from "@/app-components/inputs/Input";
import NlpPatternSelect from "@/app-components/inputs/NlpPatternSelect";
import { RegexInput } from "@/app-components/inputs/RegexInput";
import { useTranslate } from "@/hooks/useTranslate";
import {
  IBlockAttributes,
  IBlockFull,
  NlpPattern,
  Pattern,
  PatternType,
  PayloadPattern,
} from "@/types/block.types";

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
  // const getNlpEntityFromCache = useGetFromCache(EntityType.NLP_ENTITY);
  const [pattern, setPattern] = useState<Pattern>(value);
  const [patternType, setPatternType] = useState<PatternType>(getType(value));
  const isPostbackType = ["payload", "content", "menu"].includes(patternType);
  const types = [
    { value: "text", label: t("label.match_sound") },
    { value: "regex", label: t("label.regex") },
    { value: "payload", label: t("label.postback") },
    { value: "nlp", label: t("label.nlp") },
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
          value={isPostbackType ? "payload" : patternType}
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
        {patternType === "nlp" && (
          <NlpPatternSelect
            patterns={pattern as NlpPattern[]}
            onChange={setPattern}
          />
        )}
        {isPostbackType ? (
          <PostbackInput
            onChange={(payload) => {
              payload && setPattern(payload);
            }}
            defaultValue={pattern as PayloadPattern}
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
