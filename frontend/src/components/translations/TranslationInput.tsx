/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Grid } from "@mui/material";
import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import { Input } from "@/app-components/inputs/Input";
import {
  ITranslationAttributes,
  ITranslations,
} from "@/types/translation.types";

const isRTL = (language: string) => {
  return ["AR"].includes(language.toUpperCase());
};

interface RenderTranslationInputProps {
  language: keyof ITranslations;
  field: ControllerRenderProps<ITranslationAttributes, any>;
}

const TranslationInput: React.FC<RenderTranslationInputProps> = ({
  language,
  field,
}) => (
  <Input
    inputRef={field.ref}
    dir={isRTL(language) ? "rtl" : "ltr"}
    label={
      <Grid container dir="ltr">
        <Grid>{language.toUpperCase()}</Grid>
        <Grid>{field.value ? <CheckIcon /> : <CloseIcon />}</Grid>
      </Grid>
    }
    multiline={true}
    {...field}
  />
);

TranslationInput.displayName = "TranslationInput";

export default TranslationInput;
