/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import SearchIcon from "@mui/icons-material/Search";
import { TextFieldProps } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

import { Adornment } from "./Adornment";
import { Input } from "./Input";

export const FilterTextfield = (props: TextFieldProps) => {
  const { t } = useTranslate();

  //TODO: replace the native delete text button by a styled custom button
  return (
    <Input
      type="search"
      InputProps={{
        startAdornment: <Adornment Icon={SearchIcon} />,
      }}
      placeholder={t("placeholder.keywords")}
      {...props}
    />
  );
};
