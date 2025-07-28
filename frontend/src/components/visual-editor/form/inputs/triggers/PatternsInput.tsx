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
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import { Box, styled } from "@mui/material";
import { FC, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import DropdownButton, {
  DropdownButtonAction,
} from "@/app-components/buttons/DropdownButton";
import { useSimpleFieldArray } from "@/hooks/useSimpleFieldArray";
import { useTranslate } from "@/hooks/useTranslate";
import { IBlockAttributes, Pattern, PatternType } from "@/types/block.types";
import { PayloadType } from "@/types/message.types";
import { extractRegexBody, isRegex, isRegexString } from "@/utils/string";
import { SXStyleOptions } from "@/utils/SXStyleOptions";

import PatternInput from "./PatternInput";

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
  const { clearErrors, control } = useFormContext<IBlockAttributes>();
  const { fields, append, remove } = useSimpleFieldArray<Pattern>({
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
    <Box display="flex" flexDirection="column" key={fields.length}>
      <Box display="flex" flexDirection="column">
        {!fields?.length ? (
          <StyledNoPatternsDiv>{t("label.no_patterns")}</StyledNoPatternsDiv>
        ) : (
          fields?.map(({ id, value }, idx) => {
            const patternType = getPatternType(value);

            return (
              <Controller
                key={id}
                name={`patterns.${idx}`}
                defaultValue={value}
                rules={{
                  validate: (value) => {
                    if (patternType === PatternType.regex) {
                      if (!value || value === "//") {
                        return t("message.regex_is_empty");
                      } else if (
                        !(typeof value === "string") ||
                        !isRegex(extractRegexBody(value))
                      ) {
                        return t("message.regex_is_invalid");
                      }
                    } else if (patternType === PatternType.text && !value) {
                      return t("message.text_is_required");
                    } else if (!value) {
                      return t("message.required");
                    }

                    return true;
                  },
                }}
                control={control}
                render={({ field }) => (
                  <PatternInput
                    name={field.name}
                    index={idx}
                    patternType={patternType}
                    value={field.value}
                    onChange={field.onChange}
                    onRemove={handleRemove}
                    ref={field.ref}
                  />
                )}
              />
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
