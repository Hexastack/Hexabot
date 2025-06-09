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
import { NlpPattern, Pattern, PayloadPattern } from "@/types/block.types";
import { PatternType } from "@/types/pattern.types";
import { getPatternType } from "@/utils/pattern";
import { extractRegexBody, formatWithSlashes, isRegex } from "@/utils/string";

import { OutcomeInput } from "./OutcomeInput";
import { PostbackInput } from "./PostbackInput";

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
          const isEmpty = (val: string) => !val || val === "";

          if (type === PatternType.REGEX || type === PatternType.TEXT) {
            if (typeof currentPatternValue !== "string") {
              return t("message.text_is_required");
            }
            const value = currentPatternValue.trim();

            if (type === PatternType.REGEX) {
              const regexBody = extractRegexBody(value);

              if (isEmpty(regexBody)) {
                return t("message.regex_is_empty");
              }
              if (!isRegex(regexBody)) {
                return t("message.regex_is_invalid");
              }
            } else if (type === PatternType.TEXT) {
              if (isEmpty(value)) {
                return t("message.text_is_required");
              }
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
            {currentPatternType === PatternType.NLP && (
              <NlpPatternSelect
                patterns={patternForPath as NlpPattern[]}
                onChange={field.onChange}
              />
            )}
            {[
              PatternType.PAYLOAD,
              PatternType.CONTENT,
              PatternType.MENU,
            ].includes(currentPatternType) ? (
              <PostbackInput
                onChange={(payload) => {
                  payload && field.onChange(payload);
                }}
                defaultValue={patternForPath as PayloadPattern}
              />
            ) : null}
            {currentPatternType === PatternType.OUTCOME ? (
              <OutcomeInput
                onChange={(payload) => {
                  payload && field.onChange(payload);
                }}
                defaultValue={patternForPath as PayloadPattern}
              />
            ) : null}
            {typeof patternForPath === "string" &&
            currentPatternType === PatternType.REGEX ? (
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
            currentPatternType === PatternType.TEXT ? (
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
