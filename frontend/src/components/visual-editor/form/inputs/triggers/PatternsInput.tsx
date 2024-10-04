/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Grid, IconButton, styled } from "@mui/material";
import { FC, Fragment, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { useTranslate } from "@/hooks/useTranslate";
import { Pattern } from "@/types/block.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";
import { createValueWithId, ValueWithId } from "@/utils/valueWithId";

import PatternInput from "./PatternInput";
import { getInputControls } from "../../utils/inputControls";

type PatternsInputProps = {
  value: Pattern[];
  onChange: (patterns: Pattern[]) => void;
  minInput: number;
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
const PatternsInput: FC<PatternsInputProps> = ({ value, onChange }) => {
  const { t } = useTranslate();
  const [patterns, setPatterns] = useState<ValueWithId<Pattern>[]>(
    value.map((pattern) => createValueWithId(pattern)),
  );
  const {
    register,
    formState: { errors },
  } = useFormContext<any>();
  const addInput = () => {
    setPatterns([...patterns, createValueWithId<Pattern>("")]);
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
  }, [patterns]);

  return (
    <Box>
      <Grid container spacing={2}>
        {patterns.length == 0 ? (
          <StyledNoPatternsDiv>{t("label.no_patterns")}</StyledNoPatternsDiv>
        ) : (
          patterns.map(({ value, id }, idx) => (
            <Fragment key={id}>
              <Grid item xs={1}>
                <IconButton onClick={() => removeInput(idx)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
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
            </Fragment>
          ))
        )}
      </Grid>
      <Button
        variant="contained"
        color="primary"
        onClick={addInput}
        startIcon={<AddIcon />}
        sx={{ marginTop: 2, float: "right" }}
      >
        {t("button.add_pattern")}
      </Button>
    </Box>
  );
};

PatternsInput.displayName = "PatternsInput";

export default PatternsInput;
