/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TextField, TextFieldProps } from "@mui/material";
import { forwardRef } from "react";

export const Textarea = forwardRef<any, TextFieldProps>((props, ref) => (
  <TextField ref={ref} multiline minRows="2" {...props} />
));

Textarea.displayName = "Textarea";
