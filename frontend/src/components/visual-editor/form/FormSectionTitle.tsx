/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
