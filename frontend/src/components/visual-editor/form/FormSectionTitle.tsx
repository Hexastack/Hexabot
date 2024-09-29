/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Stack, Typography } from "@mui/material";
import { FC, SVGProps } from "react";

export const FormSectionTitle = ({
  title,
  Icon: Icon,
}: {
  title: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
}) => {
  return (
    <Stack direction="row" alignItems="center" gap={1} mb={1}>
      <Icon width="24px" height="24px" />
      <Typography variant="h6" fontWeight="bold">
        {title}
      </Typography>
    </Stack>
  );
};
