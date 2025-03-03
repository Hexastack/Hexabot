/*
 * Copyright © 2024 Hexastack. All rights reserved.
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
import { FC, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import DropdownButton, {
  DropdownButtonAction,
} from "@/app-components/buttons/DropdownButton";
import { useTranslate } from "@/hooks/useTranslate";
import { Pattern } from "@/types/block.types";
import { PayloadType } from "@/types/message.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";
import { createValueWithId, ValueWithId } from "@/utils/valueWithId";

import { getInputControls } from "../../utils/inputControls";

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
  value: Pattern[];
  onChange: (patterns: Pattern[]) => void;
  minInput: number;
};

const PatternsInput: FC<PatternsInputProps> = ({ value, onChange }) => {
  const { t } = useTranslate();
  const theme = useTheme();
  const [patterns, setPatterns] = useState<ValueWithId<Pattern>[]>(
    value.map((pattern) => createValueWithId(pattern)),
  );
  const {
    register,
    formState: { errors },
  } = useFormContext<any>();
  const addInput = (defaultValue: Pattern) => {
    setPatterns([...patterns, createValueWithId<Pattern>(defaultValue)]);
  };
  const removeInput = (index: number) => {
    const updatedPatterns = [...patterns];

    updatedPatterns.splice(index, 1);

    setPatterns(updatedPatterns);
  };
  const updateInput = (index: number) => (p: Pattern) => {
    patterns[index].value = p;
    setPatterns([...patterns]);
  };

  useEffect(() => {
    onChange(patterns.map(({ value }) => value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patterns]);

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

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" flexDirection="column">
        {patterns.length == 0 ? (
          <StyledNoPatternsDiv>{t("label.no_patterns")}</StyledNoPatternsDiv>
        ) : (
          patterns.map(({ value, id }, idx) => (
            <Box display="flex" alignItems="center" mt={2} key={id}>
              {idx > 0 && (
                <Chip
                  sx={{ m: 1, color: theme.palette.grey[600] }}
                  label={t("label.or")}
                  size="small"
                  variant="outlined"
                />
              )}
              <PatternInput
                idx={idx}
                value={value}
                onChange={updateInput(idx)}
                getInputProps={getInputControls(
                  "label",
                  errors,
                  register,
                  t("message.text_is_required"),
                )}
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
