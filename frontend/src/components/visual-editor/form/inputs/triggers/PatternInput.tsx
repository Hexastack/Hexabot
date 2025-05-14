/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, TextFieldProps } from "@mui/material";
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
import {
  extractRegexBody,
  formatWithSlashes,
  isRegex,
  isRegexString,
} from "@/utils/string";

import { OutcomeInput } from "./OutcomeInput";
import { PostbackInput } from "./PostbackInput";

const getPatternType = (pattern: Pattern): PatternType => {
  if (isRegexString(pattern)) {
    return "regex";
  } else if (Array.isArray(pattern)) {
    return "nlp";
  } else if (typeof pattern === "object") {
    if (pattern?.type === "menu") {
      return "menu";
    } else if (pattern?.type === "content") {
      return "content";
    } else if (pattern?.type === "outcome") {
      return "outcome";
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
  const [pattern, setPattern] = useState<Pattern>(value);
  const patternType = getPatternType(value);
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
    <Box display="flex" flexGrow={1}>
      {patternType === "nlp" && (
        <NlpPatternSelect
          patterns={pattern as NlpPattern[]}
          onChange={setPattern}
        />
      )}
      {["payload", "content", "menu"].includes(patternType) ? (
        <PostbackInput
          onChange={(payload) => {
            payload && setPattern(payload);
          }}
          defaultValue={pattern as PayloadPattern}
        />
      ) : null}
      {patternType === "outcome" ? (
        <OutcomeInput
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
              return isRegex(extractRegexBody(pattern))
                ? true
                : t("message.regex_is_invalid");
            },
            setValueAs: (v) => (isRegexString(v) ? v : formatWithSlashes(v)),
          })}
          value={extractRegexBody(value)}
          label={t("label.regex")}
          onChange={(e) => onChange(formatWithSlashes(e.target.value))}
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
    </Box>
  );
};

export default PatternInput;
