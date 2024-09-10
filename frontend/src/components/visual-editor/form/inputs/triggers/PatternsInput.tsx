/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Grid, IconButton, styled } from "@mui/material";
import { FC, Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Pattern } from "@/types/block.types";
import { SXStyleOptions } from "@/utils/SXStyleOptions";
import { createValueWithId, ValueWithId } from "@/utils/valueWithId";

import PatternInput from "./PatternInput";

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
  const { t } = useTranslation();
  const [patterns, setPatterns] = useState<ValueWithId<Pattern>[]>(
    value.map((pattern) => createValueWithId(pattern)),
  );
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
