/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid } from "@mui/material";
import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import { Input } from "@/app-components/inputs/Input";
import { ILanguage } from "@/types/language.types";
import { ITranslationAttributes } from "@/types/translation.types";

interface RenderTranslationInputProps {
  language: ILanguage;
  field: ControllerRenderProps<ITranslationAttributes, any>;
}

const TranslationInput: React.FC<RenderTranslationInputProps> = ({
  language,
  field,
}) => (
  <Input
    inputRef={field.ref}
    dir={language.isRTL ? "rtl" : "ltr"}
    label={
      <Grid container dir="ltr">
        <Grid>{language.title}</Grid>
      </Grid>
    }
    multiline={true}
    minRows={3}
    {...field}
  />
);

TranslationInput.displayName = "TranslationInput";

export default TranslationInput;
