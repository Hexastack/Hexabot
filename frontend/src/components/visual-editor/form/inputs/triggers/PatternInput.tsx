/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box } from "@mui/material";
import { FC } from "react";
import { ControllerRenderProps } from "react-hook-form";

import { Input } from "@/app-components/inputs/Input";
import NlpPatternSelect from "@/app-components/inputs/NlpPatternSelect";
import { RegexInput } from "@/app-components/inputs/RegexInput";
import { useTranslate } from "@/hooks/useTranslate";
import {
  IBlockAttributes,
  NlpPattern,
  PayloadPattern,
} from "@/types/block.types";
import { PatternType } from "@/types/pattern.types";
import { extractRegexBody, formatWithSlashes } from "@/utils/string";

import { OutcomeInput } from "./OutcomeInput";
import { PostbackInput } from "./PostbackInput";

interface PatternInputProps
  extends ControllerRenderProps<IBlockAttributes, `patterns.${number}`> {
  currentPatternType: PatternType;
  error: boolean;
  helperText: string | undefined;
}

const PatternInput: FC<PatternInputProps> = ({
  value,
  onChange,
  currentPatternType,
  error,
  helperText,
}) => {
  const { t } = useTranslate();

  return (
    <Box display="flex" flexGrow={1}>
      {currentPatternType === PatternType.NLP && (
        <NlpPatternSelect
          patterns={value as NlpPattern[]}
          onChange={onChange}
        />
      )}
      {[PatternType.PAYLOAD, PatternType.CONTENT, PatternType.MENU].includes(
        currentPatternType,
      ) ? (
        <PostbackInput
          onChange={(payload) => {
            payload && onChange(payload);
          }}
          defaultValue={value as PayloadPattern}
        />
      ) : null}
      {currentPatternType === PatternType.OUTCOME ? (
        <OutcomeInput
          onChange={(payload) => {
            payload && onChange(payload);
          }}
          defaultValue={value as PayloadPattern}
        />
      ) : null}
      {currentPatternType === PatternType.REGEX ? (
        <RegexInput
          value={
            typeof value === "object" && value !== null && "value" in value
              ? extractRegexBody(value.value)
              : ""
          }
          label={t("label.regex")}
          onChange={(e) =>
            onChange({
              value: formatWithSlashes(e.target.value),
              type: "regex",
            })
          }
          required
          error={error}
          helperText={helperText}
        />
      ) : null}
      {currentPatternType === PatternType.TEXT ? (
        <Input
          label={t("label.text")}
          value={
            typeof value === "object" && value !== null && "value" in value
              ? value.value
              : value
          }
          onChange={(e) => onChange({ value: e.target.value, type: "text" })}
          error={error}
          helperText={helperText}
          required
        />
      ) : null}
    </Box>
  );
};

export default PatternInput;
