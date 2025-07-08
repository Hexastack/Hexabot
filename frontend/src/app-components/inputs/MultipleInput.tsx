/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { RemoveCircleOutline } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  TextFieldProps,
} from "@mui/material";
import {
  ChangeEvent,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { Input } from "./Input";

type MultipleInputProps = TextFieldProps & {
  value: string[];
  onChange?: (values: string[]) => void;
  minInput?: number;
  getInputProps?: (index: number) => TextFieldProps;
};

const createEmptyInputs = (count: number, startId: number) =>
  Array.from({ length: count }, (_, idx) => ({
    id: startId + idx,
    value: "",
  }));
const MultipleInput = forwardRef<HTMLDivElement, MultipleInputProps>(
  (
    {
      value,
      onChange,
      minInput = 0,
      helperText,
      label,
      disabled,
      getInputProps,
      ...rest
    },
    ref,
  ) => {
    const { t } = useTranslate();
    const [inputs, setInputs] = useState<Array<{ id: number; value: string }>>(
      value
        ? value.length >= minInput
          ? value.map((v, idx) => ({ id: idx, value: v }))
          : [
              ...value.map((v, idx) => ({ id: idx, value: v })),
              ...createEmptyInputs(minInput - value.length, Date.now()),
            ]
        : createEmptyInputs(minInput, Date.now()),
    );
    const handleInputChange = useCallback(
      (
        id: number,
        event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
      ) => {
        const newInputs = inputs.map((input) => {
          if (input.id === id) {
            return { ...input, value: event.target.value };
          }

          return input;
        });

        setInputs(newInputs);
      },
      [inputs, setInputs],
    );
    const handleAddInput = useCallback(() => {
      setInputs([...inputs, { id: Date.now(), value: "" }]);
    }, [inputs, setInputs]);
    const handleRemoveInput = useCallback(
      (id: number) => {
        setInputs((prevInputs) => {
          const updatedInputs = prevInputs.filter((input) => input.id !== id);

          if (updatedInputs.length === 0) {
            return [{ id: Date.now(), value: "" }];
          }

          return updatedInputs;
        });
      },
      [inputs, setInputs],
    );

    useEffect(() => {
      // Call the provided onChange with all current values whenever inputs change
      if (onChange) {
        const newValue = inputs.map(({ value }) => value);

        if (value && value.join() !== newValue.join()) {
          onChange(newValue);
        }
      }
    }, [inputs, onChange, value]);

    return (
      <Grid container ref={ref} direction="column" mb={1}>
        {label && (
          <FormLabel sx={{ display: "block", marginBottom: "1rem" }}>
            {label}
          </FormLabel>
        )}
        <Grid ml={0}>
          {inputs.map((input, idx) => (
            <Box
              key={input.id}
              display="flex"
              alignItems="center"
              gap={1}
              mb={1}
            >
              <Input
                {...(getInputProps ? getInputProps(idx) : null)}
                {...rest}
                disabled={disabled}
                value={input.value}
                onChange={(e) => {
                  handleInputChange(input.id, e);
                }}
                fullWidth
              />
              <IconButton
                color="error"
                onClick={() => handleRemoveInput(input.id)}
                disabled={inputs.length <= minInput}
              >
                <RemoveCircleOutline />
              </IconButton>
            </Box>
          ))}
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
          >
            <FormHelperText>{helperText}</FormHelperText>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddInput}
              startIcon={<AddIcon />}
              disabled={disabled}
            >
              {t("button.add")}
            </Button>
          </Box>
        </Grid>
      </Grid>
    );
  },
);

MultipleInput.displayName = "MultipleInput";

export default MultipleInput;
