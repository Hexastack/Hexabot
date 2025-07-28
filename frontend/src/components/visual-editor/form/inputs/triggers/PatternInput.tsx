/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Box, Chip, IconButton, useTheme } from "@mui/material";
import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";

import { Input } from "@/app-components/inputs/Input";
import NlpPatternSelect from "@/app-components/inputs/NlpPatternSelect";
import { RegexInput } from "@/app-components/inputs/RegexInput";
import { useTranslate } from "@/hooks/useTranslate";
import {
    IBlockAttributes,
    NlpPattern,
    Pattern,
    PatternType,
    PayloadPattern,
} from "@/types/block.types";
import { extractRegexBody, formatWithSlashes } from "@/utils/string";

import { OutcomeInput } from "./OutcomeInput";
import { PostbackInput } from "./PostbackInput";

type PatternInputProps = {
  name: string;
  value: Pattern;
  index: number;
  patternType: PatternType;
  onChange: (value: Pattern) => void;
  onRemove: (idx: number) => void;
};

const PatternInput = forwardRef<HTMLDivElement, PatternInputProps>(
  ({ value, index, patternType, onChange, onRemove }, ref) => {
  const { t } = useTranslate();
  const theme = useTheme();
  const {
    formState: { errors },
  } = useFormContext<IBlockAttributes>();

  return (
    <Box display="flex" alignItems="center" mt={2} ref={ref}>
      {index > 0 && (
        <Chip
          sx={{ m: 1, color: theme.palette.grey[600] }}
          label={t("label.or")}
          size="small"
          variant="outlined"
        />
      )}
      <Box display="flex" flexGrow={1}>
        {patternType === PatternType.nlp && (
          <NlpPatternSelect
            patterns={value as NlpPattern[]}
            onChange={onChange}
            fullWidth={true}
          />
        )}
        {[PatternType.payload, PatternType.content, PatternType.menu].includes(
          patternType,
        ) ? (
          <PostbackInput
            onChange={onChange}
            defaultValue={value as PayloadPattern}
          />
        ) : null}
        {patternType === PatternType.outcome ? (
          <OutcomeInput
            onChange={onChange}
            defaultValue={value as PayloadPattern}
          />
        ) : null}
        {typeof value === "string" && patternType === PatternType.regex ? (
          <RegexInput
            value={extractRegexBody(value)}
            onChange={(e) => onChange(formatWithSlashes(e.target.value))}
            label={t("label.regex")}
            error={!!errors?.patterns?.[index]}
            helperText={errors?.patterns?.[index]?.message}
            required
          />
        ) : null}
        {typeof value === "string" && patternType === PatternType.text ? (
          <Input
            label={t("label.text")}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            defaultValue={value}
            error={!!errors?.patterns?.[index]}
            helperText={errors?.patterns?.[index]?.message}
          />
        ) : null}
      </Box>
      <IconButton size="small" color="error" onClick={() => onRemove(index)} sx={{ alignSelf: 'flex-start'}}>
        <RemoveCircleOutlineIcon />
      </IconButton>
    </Box>
  );
});

PatternInput.displayName = "PatternInput";

export default PatternInput;
