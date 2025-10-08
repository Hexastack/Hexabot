/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { TextFieldProps } from "@mui/material";
import { forwardRef } from "react";

import { Input } from "./Input";

export const Textarea = forwardRef<any, TextFieldProps>((props, ref) => (
  <Input ref={ref} multiline minRows="2" {...props} />
));

Textarea.displayName = "Textarea";
