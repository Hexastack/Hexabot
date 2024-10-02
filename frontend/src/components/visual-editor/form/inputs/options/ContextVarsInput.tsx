/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Grid,
  IconButton,
} from "@mui/material";
import { FC, Fragment, useEffect, useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { CaptureVar } from "@/types/block.types";
import { ValueWithId, createValueWithId } from "@/utils/valueWithId";

import ContextVarInput from "./ContextVarInput";

type ContextVarsInputProps = {
  value: CaptureVar[];
  onChange: (patterns: CaptureVar[]) => void;
};

const ContextVarsInput: FC<ContextVarsInputProps> = ({ value, onChange }) => {
  const { t } = useTranslate();
  const [vars, setVars] = useState<ValueWithId<CaptureVar>[]>(
    value.map((v) => createValueWithId(v)),
  );
  const addInput = () => {
    setVars([...vars, createValueWithId({ entity: -1, context_var: null })]);
  };
  const removeInput = (index: number) => {
    const updatedVars = [...vars];

    updatedVars.splice(index, 1);
    setVars(updatedVars);
  };
  const updateInput = (index: number) => (p: CaptureVar) => {
    vars[index].value = p;
    setVars([...vars]);
  };

  useEffect(() => {
    onChange(vars.map(({ value }) => value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vars]);

  return (
    <Accordion defaultExpanded={vars?.length > 0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <CheckCircleIcon
          color={vars?.length > 0 ? "success" : "disabled"}
          sx={{ marginRight: ".5rem" }}
        />
        {t("label.capture_context_vars")}
      </AccordionSummary>
      <AccordionDetails sx={{ display: "flex", flexDirection: "column" }}>
        <Grid container spacing={2}>
          {vars.map(({ value, id }, idx) => (
            <Fragment key={id}>
              <Grid item xs={1}>
                <IconButton onClick={() => removeInput(idx)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
              <ContextVarInput
                value={value}
                onChange={updateInput(idx)}
                idx={idx}
              />
            </Fragment>
          ))}
        </Grid>
        <Button
          variant="contained"
          color="primary"
          onClick={addInput}
          startIcon={<AddIcon />}
          sx={{ marginTop: 2, alignSelf: "end" }}
        >
          {t("button.add")}
        </Button>
      </AccordionDetails>
    </Accordion>
  );
};

export default ContextVarsInput;
