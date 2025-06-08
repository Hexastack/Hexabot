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
import {
  Control,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";

import DropdownButton, {
  DropdownButtonAction,
} from "@/app-components/buttons/DropdownButton";
import { useTranslate } from "@/hooks/useTranslate";
import { Pattern } from "@/types/block.types";
import { PayloadType } from "@/types/message.types";
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

type PatternsInputProps = {
  control: Control<any>;
  name: string;
  fields: FieldArrayWithId<any, string, "fieldId">[];
  append: UseFieldArrayAppend<any, string>;
  remove: UseFieldArrayRemove;
};

const PatternsInput: FC<PatternsInputProps> = ({
  control,
  name,
  fields,
  append,
  remove,
}) => {
  const { t } = useTranslate();
  const theme = useTheme();
  const addInput = (defaultValue: Pattern) => {
    append(defaultValue);
  };
  const removeInput = (index: number) => {
    remove(index);
  };
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
            <Box display="flex" alignItems="center" mt={2} key={field.fieldId}>
              {idx > 0 && (
                <Chip
                  sx={{ m: 1, color: theme.palette.grey[600] }}
                  label={t("label.or")}
                  size="small"
                  variant="outlined"
                />
              )}
              <PatternInput
                control={control}
                basePath={`${name}.${idx}`}
                //idx={idx}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => removeInput(idx)}
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
        onClick={(action) => addInput(action.defaultValue as Pattern)}
        icon={<AddIcon />}
      />
    </Box>
  );
};

PatternsInput.displayName = "PatternsInput";

export default PatternsInput;
