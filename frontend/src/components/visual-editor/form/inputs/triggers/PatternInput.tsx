/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box } from "@mui/material";
import { FC } from "react";
import { Control, Controller } from "react-hook-form";

import { Input } from "@/app-components/inputs/Input";
import NlpPatternSelect from "@/app-components/inputs/NlpPatternSelect";
import { RegexInput } from "@/app-components/inputs/RegexInput";
import { useTranslate } from "@/hooks/useTranslate";
import {
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
  if (typeof pattern === "string") {
    return isRegexString(pattern) ? "regex" : "text";
  }

  if (Array.isArray(pattern)) {
    return "nlp";
  }

  if (pattern && typeof pattern === "object") {
    switch (pattern.type) {
      case "menu":
        return "menu";
      case "content":
        return "content";
      case "outcome":
        return "outcome";
      default:
        return "payload";
    }
  }

  return "text";
};

type PatternInputProps = {
  control: Control<any>;
  basePath: string;
};

const PatternInput: FC<PatternInputProps> = ({ control, basePath }) => {
  const { t } = useTranslate();

  return (
    <Controller
      name={basePath}
      control={control}
      rules={{
        validate: (currentPatternValue: Pattern) => {
          const type = getPatternType(currentPatternValue);

          if (type === "regex") {
            const regexString = currentPatternValue as string;

            if (!regexString || extractRegexBody(regexString).trim() === "") {
              return t("message.regex_is_empty");
            }
            if (!isRegex(extractRegexBody(regexString))) {
              return t("message.regex_is_invalid");
            }
          } else if (type === "text") {
            const textString = currentPatternValue as string;

            if (!textString || textString.trim() === "") {
              return t("message.text_is_required");
            }
          }

          return true;
        },
      }}
      render={({ field, fieldState }) => {
        const patternForPath = field.value as Pattern;
        const currentPatternType = getPatternType(patternForPath);

        return (
          <Box display="flex" flexGrow={1}>
            {currentPatternType === "nlp" && (
              <NlpPatternSelect
                patterns={patternForPath as NlpPattern[]}
                onChange={field.onChange}
              />
            )}
            {["payload", "content", "menu"].includes(currentPatternType) ? (
              <PostbackInput
                onChange={(payload) => {
                  payload && field.onChange(payload);
                }}
                defaultValue={patternForPath as PayloadPattern}
              />
            ) : null}
            {currentPatternType === "outcome" ? (
              <OutcomeInput
                onChange={(payload) => {
                  payload && field.onChange(payload);
                }}
                defaultValue={patternForPath as PayloadPattern}
              />
            ) : null}
            {typeof patternForPath === "string" &&
            currentPatternType === "regex" ? (
              <RegexInput
                value={extractRegexBody(patternForPath as string)}
                label={t("label.regex")}
                onChange={(e) =>
                  field.onChange(formatWithSlashes(e.target.value))
                }
                required
                error={fieldState.invalid}
                helperText={fieldState.error?.message}
              />
            ) : null}
            {typeof patternForPath === "string" &&
            currentPatternType === "text" ? (
              <Input
                label={t("label.text")}
                value={patternForPath as string}
                onChange={(e) => field.onChange(e.target.value)}
                error={fieldState.invalid}
                helperText={fieldState.error?.message}
                required
              />
            ) : null}
          </Box>
        );
      }}
    />
  );
};

export default PatternInput;
