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
import { useFormContext } from "react-hook-form";

import DropdownButton, {
  DropdownButtonAction,
} from "@/app-components/buttons/DropdownButton";
import { Input } from "@/app-components/inputs/Input";
import NlpPatternSelect from "@/app-components/inputs/NlpPatternSelect";
import { RegexInput } from "@/app-components/inputs/RegexInput";
import { useSimpleFieldArray } from "@/hooks/useSimpleFieldArray";
import { useTranslate } from "@/hooks/useTranslate";
import {
  IBlockAttributes,
  NlpPattern,
  Pattern,
  PatternType,
  PayloadPattern,
} from "@/types/block.types";
import { PayloadType } from "@/types/message.types";
import {
  extractRegexBody,
  formatWithSlashes,
  isRegex,
  isRegexString,
} from "@/utils/string";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

import { OutcomeInput } from "./OutcomeInput";
import { PostbackInput } from "./PostbackInput";

const getPatternType = (pattern: Pattern): PatternType => {
  if (isRegexString(pattern)) {
    return PatternType.regex;
  }

  if (Array.isArray(pattern)) {
    return PatternType.nlp;
  }

  if (typeof pattern === "object" && pattern !== null) {
    switch (pattern.type) {
      case PayloadType.menu:
        return PatternType.menu;
      case PayloadType.content:
        return PatternType.content;
      case PayloadType.outcome:
        return PatternType.outcome;
      default:
        return PatternType.payload;
    }
  }

  return PatternType.text;
};
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
  const {
    formState: { errors },
    setError,
    clearErrors,
  } = useFormContext<IBlockAttributes>();
  const { fields, append, remove, update } = useSimpleFieldArray<Pattern>({
    name: "patterns",
  });
  const actions: DropdownButtonAction[] = useMemo(
    () => [
      {
        icon: <SpellcheckIcon />,
        name: t("label.exact_match"),
        defaultValue: "",
      },
      { icon: <AbcIcon />, name: t("label.pattern_match"), defaultValue: "//" },
      {
        icon: <PsychologyAltIcon />,
        name: t("label.intent_match"),
        defaultValue: [],
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
  const handleRemove = (idx: number) => {
    clearErrors(`patterns.${idx}`);
    remove(idx);
  };

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" flexDirection="column">
        {!fields?.length ? (
          <StyledNoPatternsDiv>{t("label.no_patterns")}</StyledNoPatternsDiv>
        ) : (
          fields?.map(({ id, value }, idx) => {
            const patternType = getPatternType(value);

            return (
              <Box
                display="flex"
                alignItems="center"
                mt={2}
                key={`${patternType}-${id}`}
              >
                {idx > 0 && (
                  <Chip
                    sx={{ m: 1, color: theme.palette.grey[600] }}
                    label={t("label.or")}
                    size="small"
                    variant="outlined"
                  />
                )}
                <Box display="flex" flexGrow={1}>
                  {patternType === "nlp" && (
                    <NlpPatternSelect
                      patterns={value as NlpPattern[]}
                      onChange={(patterns) => update(idx, patterns)}
                      fullWidth={true}
                    />
                  )}
                  {["payload", "content", "menu"].includes(patternType) ? (
                    <PostbackInput
                      onChange={(pattern) => update(idx, pattern)}
                      defaultValue={value as PayloadPattern}
                    />
                  ) : null}
                  {patternType === "outcome" ? (
                    <OutcomeInput
                      onChange={(pattern) => update(idx, pattern)}
                      defaultValue={value as PayloadPattern}
                    />
                  ) : null}
                  {typeof value === "string" && patternType === "regex" ? (
                    <RegexInput
                      helperText={
                        errors.patterns?.[idx]
                          ? errors.patterns[idx].message
                          : undefined
                      }
                      error={!!errors.patterns?.[idx]}
                      value={extractRegexBody(value)}
                      label={t("label.regex")}
                      onChange={(e) => {
                        const patternBody = e.target.value;

                        if (!isRegex(patternBody as string)) {
                          setError(`patterns.${idx}`, {
                            type: "manual",
                            message: t("message.regex_is_invalid"),
                          });
                        } else {
                          clearErrors(`patterns.${idx}`);
                        }

                        update(idx, formatWithSlashes(patternBody));
                      }}
                      required
                    />
                  ) : null}
                  {typeof value === "string" && patternType === "text" ? (
                    <Input
                      value={value}
                      label={t("label.text")}
                      error={!!errors?.patterns?.[idx]}
                      helperText={errors?.patterns?.[idx]?.message}
                      onChange={(e) => {
                        const pattern = e.target.value;

                        if (!pattern) {
                          setError(`patterns.${idx}`, {
                            type: "manual",
                            message: t("message.text_is_required"),
                          });
                        } else {
                          clearErrors(`patterns.${idx}`);
                        }

                        update(idx, pattern);
                      }}
                    />
                  ) : null}
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemove(idx)}
                >
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </Box>
            );
          })
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
