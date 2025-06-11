/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AbcIcon from "@mui/icons-material/Abc";
import AddIcon from "@mui/icons-material/Add";
import MediationIcon from "@mui/icons-material/Mediation";
import MouseIcon from "@mui/icons-material/Mouse";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import { Box, Chip, IconButton, styled, useTheme } from "@mui/material";
import { FC, useMemo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import DropdownButton, {
  DropdownButtonAction,
} from "@/app-components/buttons/DropdownButton";
import { useTranslate } from "@/hooks/useTranslate";
import { IBlockAttributes, Pattern, PatternType } from "@/types/block.types";
import { PayloadType } from "@/types/message.types";
import { getPatternType } from "@/utils/pattern";
import { extractRegexBody, isRegex } from "@/utils/string";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

import PatternInput from "./PatternInput";

const StyledNoPatternsDiv = styled("div")(
  SXStyleOptions({
    color: "grey.500",
    textAlign: "center",
    marginY: 2,
    marginX: 0,
    width: "100%",
  }),
);
const PatternsInput: FC = () => {
  const { t } = useTranslate();
  const theme = useTheme();
  const { control } = useFormContext<IBlockAttributes>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "patterns",
  });
  const actions: DropdownButtonAction[] = useMemo(
    () => [
      {
        icon: <SpellcheckIcon />,
        name: t("label.exact_match"),
        defaultValue: { value: "", type: PayloadType.text },
      },
      {
        icon: <AbcIcon />,
        name: t("label.pattern_match"),
        defaultValue: { value: "//", type: PayloadType.regex },
      },
      {
        icon: <PsychologyAltIcon />,
        name: t("label.intent_match"),
        defaultValue: [[]],
      },
      {
        icon: <MouseIcon />,
        name: t("label.interaction"),
        defaultValue: {
          label: t("label.get_started"),
          value: "GET_STARTED",
          type: PayloadType.button,
          group: "general",
        },
      },
      {
        icon: <MediationIcon />,
        name: t("label.outcome_match"),
        defaultValue: {
          label: t("label.any_outcome"),
          value: "any",
          type: PayloadType.outcome,
          group: "general",
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" flexDirection="column">
        {fields.length === 0 ? (
          <StyledNoPatternsDiv>{t("label.no_patterns")}</StyledNoPatternsDiv>
        ) : (
          fields.map((field, idx) => (
            <Box display="flex" alignItems="center" mt={2} key={field.id}>
              {idx > 0 && (
                <Chip
                  sx={{ m: 1, color: theme.palette.grey[600] }}
                  label={t("label.or")}
                  size="small"
                  variant="outlined"
                />
              )}
              <Controller
                control={control}
                name={`patterns.${idx}`}
                rules={{
                  validate: (currentPatternValue: Pattern | null) => {
                    if (currentPatternValue == null) {
                      return t("message.text_is_required");
                    }
                    if (Array.isArray(currentPatternValue)) {
                      // Add any validation for NlpPattern[] here if needed
                      return true;
                    }

                    // Otherwise, it's a PayloadPattern
                    const type = getPatternType(currentPatternValue);
                    const isEmpty = (val: string) => !val || val === "";

                    if (
                      type === PatternType.REGEX ||
                      type === PatternType.TEXT
                    ) {
                      // @ts-ignore
                      const value = currentPatternValue.value.trim();

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
                render={({ field, fieldState }) => (
                  <PatternInput
                    {...field}
                    currentPatternType={getPatternType(field.value)}
                    error={fieldState.invalid}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => remove(idx)}
              >
                <RemoveCircleOutlineIcon />
              </IconButton>
            </Box>
          ))
        )}
      </Box>
      <DropdownButton
        sx={{ alignSelf: "end", marginTop: 2 }}
        label={t("button.add_pattern")}
        actions={actions}
        onClick={(action) => append(action.defaultValue as Pattern)}
        icon={<AddIcon />}
      />
    </Box>
  );
};

PatternsInput.displayName = "PatternsInput";

export default PatternsInput;
