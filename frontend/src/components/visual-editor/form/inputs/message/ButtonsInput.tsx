/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { KeyboardReturn, Link, RemoveCircleOutline } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton } from "@mui/material";
import { FC, useEffect, useMemo, useState } from "react";
import { FieldPath } from "react-hook-form";

import DropdownButton, {
  DropdownButtonAction,
} from "@/app-components/buttons/DropdownButton";
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
  maxInput = 3,
  disablePayload = false,
  fieldPath,
}) => {
  const { t } = useTranslate();
  const [buttons, setButtons] = useState<ValueWithId<AnyButton>[]>(
    value.map((button) => createValueWithId(button)),
  );
  const actions: DropdownButtonAction[] = useMemo(
    () => [
      {
        icon: <KeyboardReturn />,
        name: t("button.postback"),
        defaultValue: {
          type: ButtonType.postback,
          title: "",
          payload: "",
        },
      },
      {
        icon: <Link />,
        name: t("button.url"),
        defaultValue: {
          type: ButtonType.web_url,
          title: "",
          url: "",
        },
      },
    ],
    [t],
  );
  const addInput = (defaultValue: AnyButton) => {
    setButtons([...buttons, createValueWithId(defaultValue)]);
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
    <Box display="flex" flexDirection="column">
      <Box display="flex" flexDirection="column">
        {buttons.map(({ value, id }, idx) => (
          <Box display="flex" flex={1} mt={2} key={id}>
            <ButtonInput
              fieldPath={fieldPath}
              idx={idx}
              button={value}
              onChange={updateInput(idx)}
              disablePayload={disablePayload}
            />
            <IconButton
              color="error"
              onClick={() => removeInput(idx)}
              disabled={buttons.length <= minInput}
            >
              <RemoveCircleOutline />
            </IconButton>
          </Box>
        ))}
      </Box>
      <DropdownButton
        sx={{ alignSelf: "end", marginTop: 2 }}
        label={t("button.add_button")}
        actions={actions}
        onClick={(action) => addInput(action.defaultValue)}
        icon={<AddIcon />}
        disabled={buttons.length >= maxInput}
      />
    </Box>
  );
};

export default ButtonsInput;
