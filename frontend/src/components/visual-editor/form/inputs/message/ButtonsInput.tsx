/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Grid, IconButton } from "@mui/material";
import { FC, Fragment, useEffect, useState } from "react";
import { FieldPath } from "react-hook-form";

import { useTranslate } from "@/hooks/useTranslate";
import { IBlockAttributes } from "@/types/block.types";
import { AnyButton, ButtonType } from "@/types/message.types";
import { ValueWithId, createValueWithId } from "@/utils/valueWithId";

import ButtonInput from "./ButtonInput";

type ButtonsInput = {
  value: AnyButton[];
  onChange: (buttons: AnyButton[]) => void;
  minInput?: number;
  maxInput?: number;
  disablePayload?: boolean;
  fieldPath: FieldPath<IBlockAttributes>;
};

const ButtonsInput: FC<ButtonsInput> = ({
  value,
  onChange,
  minInput = 1,
  maxInput = 13,
  disablePayload = false,
  fieldPath,
}) => {
  const { t } = useTranslate();
  const [buttons, setButtons] = useState<ValueWithId<AnyButton>[]>(
    value.map((button) => createValueWithId(button)),
  );
  const addInput = () => {
    setButtons([
      ...buttons,
      createValueWithId({ type: ButtonType.postback, title: "", payload: "" }),
    ]);
  };
  const removeInput = (index: number) => {
    const updatedButtons = [...buttons];

    updatedButtons.splice(index, 1);
    setButtons(
      updatedButtons.length
        ? updatedButtons
        : [
            createValueWithId({
              type: ButtonType.postback,
              title: "",
              payload: "",
            }),
          ],
    );
  };
  const updateInput = (index: number) => (p: AnyButton) => {
    buttons[index].value = p;
    setButtons([...buttons]);
  };

  useEffect(() => {
    onChange(buttons.map(({ value }) => value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttons]);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={1}>
          &nbsp;
        </Grid>
        <Grid item xs={2}>
          {t("label.type")}
        </Grid>
        <Grid item xs={3}>
          {t("label.title")}
        </Grid>
        <Grid item xs={4}>
          {t("label.payload")} / {t("label.url")}
        </Grid>
        <Grid item xs={2}>
          {t("label.webview")}
        </Grid>
        {buttons.map(({ value, id }, idx) => (
          <Fragment key={id}>
            <Grid item xs={1}>
              <IconButton
                onClick={() => removeInput(idx)}
                disabled={buttons.length <= minInput}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
            <ButtonInput
              fieldPath={fieldPath}
              idx={idx}
              button={value}
              onChange={updateInput(idx)}
              disablePayload={disablePayload}
            />
          </Fragment>
        ))}
      </Grid>
      <Button
        variant="contained"
        color="primary"
        onClick={addInput}
        startIcon={<AddIcon />}
        sx={{ m: 1, float: "right" }}
        disabled={buttons.length >= maxInput}
      >
        {t("button.add")}
      </Button>
    </Box>
  );
};

export default ButtonsInput;
